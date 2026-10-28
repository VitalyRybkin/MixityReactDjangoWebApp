from io import StringIO
from typing import Any, Final

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.db.models import Model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.tests.base_test_case import TestLoggerMixin
from logistic.models import (
    Carrier,
    Driver,
    Truck,
    TruckCapacity,
    TruckType,
)
from logistic.routes import CarrierRoutes
from logistic.tests.factories import CarrierFactory

ROLE_MATRIX: Final[dict[str, dict[str, bool]]] = {
    "Admins": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
    },
    "Order Manager": {
        "view": False,
        "add": False,
        "change": False,
        "delete": False,
    },
    "Logistic Manager": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
    },
    "Accountant": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
    },
}


LOGISTIC_MODELS: Final[tuple[type[Model], ...]] = (
    Carrier,
    Driver,
    Truck,
    TruckCapacity,
    TruckType,
)


HTTP_METHODS: Final[dict[str, str]] = {
    "view": "GET",
    "add": "POST",
    "change": "PATCH",
    "delete": "DELETE",
}


class TestLogisticPermissionMatrix(
    TestLoggerMixin,
    APITestCase,
):
    """
    Verifies Logistic permissions for all application roles.

    Group permissions are checked for all Logistic models.
    API enforcement is checked using Carrier CRUD endpoints.
    """

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        stdout = StringIO()

        call_command(
            "sync_group_permissions",
            stdout=stdout,
        )

    def _create_user_for_role(
        self,
        role: str,
    ) -> Any:
        user_model = get_user_model()

        username = "logistic_permission_" + role.lower().replace(" ", "_").replace(
            "-", "_"
        )

        user = user_model.objects.create_user(
            username=username,
            password="test_password",
        )

        group = Group.objects.get(name=role)
        user.groups.add(group)

        return user

    @staticmethod
    def _create_carrier_payload() -> dict[str, Any]:
        carrier = CarrierFactory.build()

        return {
            "name": carrier.name,
            "organization": carrier.organization,
            "address": carrier.address,
            "description": carrier.description,
            "phone": str(carrier.phone),
        }

    def _request_carrier_action(
        self,
        action: str,
    ) -> Any:
        list_url = reverse(
            f"logistic:{CarrierRoutes.LIST_CREATE.name}",
        )

        if action == "add":
            return self.client.post(
                list_url,
                self._create_carrier_payload(),
                format="json",
            )

        carrier = CarrierFactory.create()

        detail_url = reverse(
            f"logistic:{CarrierRoutes.DETAIL.name}",
            args=[carrier.pk],
        )

        if action == "view":
            return self.client.get(detail_url)

        if action == "change":
            return self.client.patch(
                detail_url,
                {
                    "description": "Updated by permission test",
                },
                format="json",
            )

        if action == "delete":
            return self.client.delete(detail_url)

        raise ValueError(
            f"Unsupported action: {action}",
        )

    @staticmethod
    def _expected_status(
        action: str,
        allowed: bool,
    ) -> int:
        if not allowed:
            return status.HTTP_403_FORBIDDEN

        return {
            "view": status.HTTP_200_OK,
            "add": status.HTTP_201_CREATED,
            "change": status.HTTP_200_OK,
            "delete": status.HTTP_200_OK,
        }[action]

    def _print_permission_result(
        self,
        *,
        role: str,
        model_name: str,
        action: str,
        allowed: bool,
    ) -> None:
        result = "ALLOWED" if allowed else "FORBIDDEN"

        self._logger_success(
            role,
            f"{model_name:<14} | " f"{action:<7} | " f"{result}",
        )

    def _print_api_result(
        self,
        *,
        role: str,
        action: str,
        status_code: int,
        allowed: bool,
    ) -> None:
        result = "ALLOWED" if allowed else "FORBIDDEN"

        self._logger_success(
            role,
            (f"{HTTP_METHODS[action]:<6} | " f"{status_code:<3} | " f"{result}"),
        )

    def test_group_logistic_permission_matrix(
        self,
    ) -> None:
        """
        Check Django permissions for every Logistic model and role.
        """

        self._logger_header(
            "LOGISTIC GROUP PERMISSION MATRIX",
        )

        for role, expected_permissions in ROLE_MATRIX.items():
            user = self._create_user_for_role(role)

            for model in LOGISTIC_MODELS:
                app_label = model._meta.app_label
                model_name = model._meta.model_name

                for action, expected in expected_permissions.items():
                    with self.subTest(
                        role=role,
                        model=model_name,
                        action=action,
                    ):
                        permission = f"{app_label}." f"{action}_{model_name}"

                        actual = user.has_perm(
                            permission,
                        )

                        self.assertEqual(
                            actual,
                            expected,
                            (
                                f"{role}: {permission} "
                                f"expected={expected}, "
                                f"actual={actual}"
                            ),
                        )

                        model_name = model._meta.model_name
                        assert model_name is not None

                        self._print_permission_result(
                            role=role,
                            model_name=model_name,
                            action=action,
                            allowed=actual,
                        )

    def test_carrier_api_permission_matrix(
        self,
    ) -> None:
        """
        Check that Carrier CRUD endpoints enforce the role matrix.
        """

        self._logger_header(
            "CARRIER API PERMISSION MATRIX",
        )

        api_actions = (
            "view",
            "add",
            "change",
            "delete",
        )

        for role, expected_permissions in ROLE_MATRIX.items():
            user = self._create_user_for_role(role)

            for action in api_actions:
                with self.subTest(
                    role=role,
                    action=action,
                ):
                    self.client.force_authenticate(
                        user=user,
                    )

                    response = self._request_carrier_action(
                        action,
                    )

                    allowed = expected_permissions[action]

                    expected_status = self._expected_status(
                        action,
                        allowed,
                    )

                    self.assertEqual(
                        response.status_code,
                        expected_status,
                        response.data,
                    )

                    self._print_api_result(
                        role=role,
                        action=action,
                        status_code=response.status_code,
                        allowed=allowed,
                    )

            self.client.force_authenticate(
                user=None,
            )
