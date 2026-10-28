from io import StringIO
from typing import Any, Final

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from contacts.factories import ContactFactory
from order.models import Order
from order.routes import OrderRoutes
from order.tests.factories import OrderFactory

ROLE_MATRIX: Final[dict[str, dict[str, bool]]] = {
    "Admins": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
        "manage_upd": True,
        "export": True,
    },
    "Order Manager": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
        "manage_upd": True,
        "export": True,
    },
    "Logistic Manager": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
        "manage_upd": True,
        "export": True,
    },
    "Accountant": {
        "view": True,
        "add": False,
        "change": False,
        "delete": False,
        "manage_upd": True,
        "export": False,
    },
}


ORDER_PERMISSIONS: Final[dict[str, str]] = {
    "view": "view_order",
    "add": "add_order",
    "change": "change_order",
    "delete": "delete_order",
    "manage_upd": "manage_order_upd",
    "export": "export_order",
}


HTTP_METHODS: Final[dict[str, str]] = {
    "view": "GET",
    "add": "POST",
    "change": "PATCH",
    "delete": "DELETE",
}


class TestOrderPermissionMatrix(APITestCase):
    """
    Verifies the Order permission matrix for all application roles.

    ROLE_MATRIX is the expected permission contract.
    Actual group permissions are populated by sync_group_permissions.
    """

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

        username = "permission_" + role.lower().replace(" ", "_").replace("-", "_")

        user = user_model.objects.create_user(
            username=username,
            password="test_password",
        )

        group = Group.objects.get(name=role)
        user.groups.add(group)

        return user

    def _create_order_payload(self) -> dict[str, Any]:
        temp_order = OrderFactory.create()

        contact = ContactFactory.create(
            client=temp_order.client,
            carrier=None,
        )

        return {
            "client": temp_order.client_id,
            "customer": temp_order.customer_id,
            "warehouse": temp_order.warehouse_id,
            "delivery_date": temp_order.delivery_date,
            "status": temp_order.status,
            "contacts": [contact.pk],
        }

    def _request_order_action(
        self,
        action: str,
    ) -> Any:
        list_url = reverse(
            f"order_orders:{OrderRoutes.LIST_CREATE.name}",
        )

        if action == "add":
            return self.client.post(
                list_url,
                self._create_order_payload(),
                format="json",
            )

        order = OrderFactory.create()

        detail_url = reverse(
            f"order_orders:{OrderRoutes.DETAIL.name}",
            args=[order.pk],
        )

        if action == "view":
            return self.client.get(detail_url)

        if action == "change":
            return self.client.patch(
                detail_url,
                {
                    "status": Order.Status.CREATED,
                    "contacts": [],
                    "products": [],
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

        expected = {
            "view": status.HTTP_200_OK,
            "add": status.HTTP_201_CREATED,
            "change": status.HTTP_200_OK,
            "delete": status.HTTP_204_NO_CONTENT,
        }

        return expected[action]

    @staticmethod
    def _print_permission_result(
        *,
        role: str,
        action: str,
        allowed: bool,
    ) -> None:
        result = "ALLOWED" if allowed else "FORBIDDEN"

        print(f"    ✓ {role:<18} | " f"{action:<11} | " f"{result}")

    @staticmethod
    def _print_api_result(
        *,
        role: str,
        action: str,
        status_code: int,
        allowed: bool,
    ) -> None:
        result = "ALLOWED" if allowed else "FORBIDDEN"

        print(
            f"    ✓ {role:<18} | "
            f"{HTTP_METHODS[action]:<6} | "
            f"{status_code:<3} | "
            f"{result}"
        )

    def test_group_order_permission_matrix(self) -> None:
        """
        Check the actual permissions assigned to every role.
        """

        print("\n=== ORDER GROUP PERMISSION MATRIX ===")

        for role, expected_permissions in ROLE_MATRIX.items():
            user = self._create_user_for_role(role)

            for action, expected in expected_permissions.items():
                with self.subTest(
                    role=role,
                    action=action,
                ):
                    codename = ORDER_PERMISSIONS[action]

                    actual = user.has_perm(
                        f"order.{codename}",
                    )

                    self.assertEqual(
                        actual,
                        expected,
                        (
                            f"{role}: order.{codename} "
                            f"expected={expected}, actual={actual}"
                        ),
                    )

                    self._print_permission_result(
                        role=role,
                        action=action,
                        allowed=actual,
                    )

    def test_order_api_permission_matrix(self) -> None:
        """
        Check that Order API CRUD endpoints enforce the role matrix.
        """

        print("\n=== ORDER API PERMISSION MATRIX ===")

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
                    self.client.force_authenticate(user=user)

                    response = self._request_order_action(
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

            self.client.force_authenticate(user=None)
