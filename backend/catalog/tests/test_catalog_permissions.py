from io import StringIO
from typing import Any, Final

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import Product
from catalog.tests.api.factories import ProductFactory
from core.tests.utils import TestLoggerMixin

ROLE_MATRIX: Final[dict[str, dict[str, bool]]] = {
    "Admins": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
    },
    "Order Manager": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
    },
    "Logistic Manager": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
    },
    "Accountant": {
        "view": False,
        "add": False,
        "change": False,
        "delete": False,
    },
}


CATALOG_PERMISSIONS: Final[dict[str, str]] = {
    "view": "view_product",
    "add": "add_product",
    "change": "change_product",
    "delete": "delete_product",
}


HTTP_METHODS: Final[dict[str, str]] = {
    "view": "GET",
    "add": "POST",
    "change": "PATCH",
    "delete": "DELETE",
}


class TestCatalogPermissionMatrix(
    TestLoggerMixin,
    APITestCase,
):
    """
    Verifies Product permissions for all application roles.
    """

    list_url = "/api/catalog/products/"

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        stdout = StringIO()

        call_command(
            "sync_group_permissions",
            stdout=stdout,
        )

    def _create_user_for_role(self, role: str) -> Any:
        user_model = get_user_model()

        username = "catalog_permission_" + role.lower().replace(" ", "_").replace(
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
    def _create_product() -> Product:
        return ProductFactory.create()

    def _request_action(
        self,
        action: str,
    ) -> Any:

        product = self._create_product()

        detail_url = f"{self.list_url}" f"{product.pk}/"

        if action == "view":
            return self.client.get(detail_url)

        if action == "change":
            return self.client.patch(
                detail_url,
                {
                    "title": "Updated by permission test",
                },
                format="json",
            )

        if action == "delete":
            return self.client.delete(detail_url)

        raise ValueError(f"Unsupported action: {action}")

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
            "delete": status.HTTP_204_NO_CONTENT,
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
            f"{action:<12} | {result}",
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

    def test_group_catalog_permission_matrix(self) -> None:
        """
        Check actual Django Product permissions assigned to every role.
        """

        self._logger_header("CATALOG GROUP PERMISSION MATRIX")

        for role, expected_permissions in ROLE_MATRIX.items():
            user = self._create_user_for_role(role)

            for action, expected in expected_permissions.items():
                with self.subTest(
                    role=role,
                    action=action,
                ):
                    codename = CATALOG_PERMISSIONS[action]

                    actual = user.has_perm(
                        f"catalog.{codename}",
                    )

                    self.assertEqual(
                        actual,
                        expected,
                        (
                            f"{role}: catalog.{codename} "
                            f"expected={expected}, "
                            f"actual={actual}"
                        ),
                    )

                    self._print_permission_result(
                        role=role,
                        action=action,
                        allowed=actual,
                    )

    def test_catalog_api_permission_matrix(self) -> None:
        """
        Check Product CRUD endpoints for every role.
        """

        self._logger_header("CATALOG API PERMISSION MATRIX")

        api_actions = (
            "view",
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

                    response = self._request_action(
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
