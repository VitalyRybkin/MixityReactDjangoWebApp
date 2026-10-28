from io import StringIO
from typing import Any, Final

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.tests.base_test_case import TestLoggerMixin
from stock.routes import WarehouseRoutes
from stock.tests.factories import WarehouseFactory

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


STOCK_PERMISSIONS: Final[dict[str, str]] = {
    "view": "view_warehouse",
    "add": "add_warehouse",
    "change": "change_warehouse",
    "delete": "delete_warehouse",
}


HTTP_METHODS: Final[dict[str, str]] = {
    "view": "GET",
    "add": "POST",
    "change": "PATCH",
    "delete": "DELETE",
}


class TestStockPermissionMatrix(
    TestLoggerMixin,
    APITestCase,
):
    """
    Verifies Warehouse permissions for all application roles.
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

        username = "stock_permission_" + role.lower().replace(" ", "_").replace(
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
    def _create_warehouse_payload() -> dict[str, Any]:
        warehouse = WarehouseFactory.build()

        return {
            "name": warehouse.name,
            "organization": warehouse.organization,
            "address": warehouse.address,
            "phone": str(warehouse.phone),
        }

    def _request_warehouse_action(
        self,
        action: str,
    ) -> Any:
        list_url = reverse(
            f"stock:{WarehouseRoutes.LIST_CREATE.name}",
        )

        if action == "add":
            return self.client.post(
                list_url,
                self._create_warehouse_payload(),
                format="json",
            )

        warehouse = WarehouseFactory.create()

        detail_url = reverse(
            f"stock:{WarehouseRoutes.DETAIL.name}",
            args=[warehouse.pk],
        )

        if action == "view":
            return self.client.get(detail_url)

        if action == "change":
            return self.client.patch(
                detail_url,
                {
                    "address": "Updated by permission test",
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
        action: str,
        allowed: bool,
    ) -> None:
        result = "ALLOWED" if allowed else "FORBIDDEN"

        self._logger_success(
            role,
            f"{action:<7} | {result}",
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

    def test_group_stock_permission_matrix(
        self,
    ) -> None:
        """
        Check actual Django Warehouse permissions for every role.
        """

        self._logger_header(
            "STOCK GROUP PERMISSION MATRIX",
        )

        for role, expected_permissions in ROLE_MATRIX.items():
            user = self._create_user_for_role(role)

            for action, expected in expected_permissions.items():
                with self.subTest(
                    role=role,
                    action=action,
                ):
                    codename = STOCK_PERMISSIONS[action]

                    actual = user.has_perm(
                        f"stock.{codename}",
                    )

                    self.assertEqual(
                        actual,
                        expected,
                        (
                            f"{role}: stock.{codename} "
                            f"expected={expected}, "
                            f"actual={actual}"
                        ),
                    )

                    self._print_permission_result(
                        role=role,
                        action=action,
                        allowed=actual,
                    )

    def test_warehouse_api_permission_matrix(
        self,
    ) -> None:
        """
        Check that Warehouse CRUD endpoints enforce the role matrix.
        """

        self._logger_header(
            "WAREHOUSE API PERMISSION MATRIX",
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

                    response = self._request_warehouse_action(
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
