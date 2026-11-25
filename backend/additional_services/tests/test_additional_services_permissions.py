"""Check the agreed AdditionalServiceRequest permissions for all four Mixity roles."""

from io import StringIO
from typing import Final

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from additional_services.models import AdditionalServiceItem, AdditionalServiceRequest
from additional_services.routes import AdditionalServicesRoutes
from core.tests.utils import TestLoggerMixin
from logistic.models import Carrier
from order.tests.factories import ConstructionObjectFactory


ROLE_MATRIX: Final[dict[str, dict[str, bool]]] = {
    "Admins": {"view": True, "add": True, "change": True, "delete": True},
    "Order Manager": {"view": True, "add": True, "change": True, "delete": False},
    "Logistic Manager": {"view": True, "add": True, "change": True, "delete": True},
    "Accountant": {"view": True, "add": True, "change": True, "delete": False},
}


class TestAdditionalServicePermissionMatrix(TestLoggerMixin, APITestCase):
    """Check permissions granted by sync_group_permissions and enforced by the API."""

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        call_command("sync_group_permissions", stdout=StringIO())

    def setUp(self) -> None:
        super().setUp()
        self.construction_object = ConstructionObjectFactory.create()
        self.carrier = Carrier.objects.create(name="Перевозчик для проверки прав")
        self.list_url = reverse(
            f"additional_services:{AdditionalServicesRoutes.LIST_CREATE.name}"
        )

    def _user(self, role: str):
        user = get_user_model().objects.create_user(
            username="additional_permissions_" + role.lower().replace(" ", "_"),
            password="test_password",
        )
        user.groups.add(Group.objects.get(name=role))
        return user

    def _payload(self) -> dict:
        return {
            "service_date": "2026-11-25",
            "direction": "site_work",
            "status": "created",
            "construction_object": self.construction_object.pk,
            "rental_contract": None,
            "carrier": self.carrier.pk,
            "repair_company": None,
            "description": "Перестановка силосов",
            "items": [
                {
                    "category": "transport",
                    "name": "Работа манипулятора",
                    "quantity": "1.000",
                    "cost_per_unit": "1000.00",
                    "price_per_unit": "1500.00",
                    "is_rebillable": True,
                }
            ],
        }

    def _object(self) -> AdditionalServiceRequest:
        obj = AdditionalServiceRequest.objects.create(
            service_date="2026-11-25",
            direction="site_work",
            status="created",
            construction_object=self.construction_object,
            carrier=self.carrier,
            description="Тест матрицы",
        )
        AdditionalServiceItem.objects.create(
            request=obj,
            category="transport",
            name="Манипулятор",
            quantity="1.000",
            cost_per_unit="1000.00",
            price_per_unit="1500.00",
            is_rebillable=True,
        )
        return obj

    @staticmethod
    def _expected_api_status(action: str, allowed: bool) -> int:
        if not allowed:
            return status.HTTP_403_FORBIDDEN
        return {
            "view": status.HTTP_200_OK,
            "add": status.HTTP_201_CREATED,
            "change": status.HTTP_200_OK,
            "status_change": status.HTTP_200_OK,
            "financial_change": status.HTTP_200_OK,
            "delete": status.HTTP_204_NO_CONTENT,
        }[action]

    def test_group_permissions(self) -> None:
        self._logger_header("ADDITIONAL SERVICES: GROUP PERMISSIONS")
        for role, actions in ROLE_MATRIX.items():
            user = self._user(role)
            for action, allowed in actions.items():
                perm = f"additional_services.{action}_additionalservicerequest"
                with self.subTest(role=role, permission=perm):
                    self.assertEqual(user.has_perm(perm), allowed)
            # Nested items have no standalone CRUD endpoints or grants.
            for action in ("view", "add", "change", "delete"):
                perm = f"additional_services.{action}_additionalserviceitem"
                with self.subTest(role=role, permission=perm):
                    if role != "Admins":
                        self.assertFalse(user.has_perm(perm))
            self._logger_success(role, "Django model permissions verified")

    def test_api_permissions(self) -> None:
        self._logger_header("ADDITIONAL SERVICES: API PERMISSIONS")
        for role, actions in ROLE_MATRIX.items():
            user = self._user(role)
            self.client.force_authenticate(user=user)
            try:
                for action in (
                    "view", "add", "change", "status_change",
                    "financial_change", "delete"
                ):
                    obj = self._object()
                    url = reverse(
                        f"additional_services:{AdditionalServicesRoutes.DETAIL.name}",
                        kwargs={"pk": obj.pk},
                    )
                    if action == "view":
                        response = self.client.get(url)
                    elif action == "add":
                        response = self.client.post(self.list_url, self._payload(), format="json")
                    elif action == "change":
                        response = self.client.patch(url, {"description": "Изменено"}, format="json")
                    elif action == "status_change":
                        response = self.client.patch(url, {"status": "completed"}, format="json")
                    elif action == "financial_change":
                        response = self.client.patch(
                            url,
                            {"items": [
                                {**self._payload()["items"][0], "price_per_unit": "2000.00"}
                            ]},
                            format="json",
                        )
                    else:
                        response = self.client.delete(url)
                    permission_action = (
                        "change"
                        if action in ("status_change", "financial_change")
                        else action
                    )
                    allowed = actions[permission_action]
                    with self.subTest(role=role, action=action):
                        self.assertEqual(
                            response.status_code,
                            self._expected_api_status(action, allowed),
                            getattr(response, "data", None),
                        )
                self._logger_success(role, "CRUD, status and finance verified")
            finally:
                self.client.force_authenticate(user=None)
