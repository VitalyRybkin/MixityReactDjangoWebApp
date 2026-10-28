from io import StringIO
from typing import Any, Final

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from order.tests.factories import ConstructionObjectFactory
from repairs.models import RepairCompany
from repairs.models.repair_request_models import RepairRequest

ROLE_MATRIX: Final[dict[str, dict[str, bool]]] = {
    "Admins": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
        "export": True,
        "print_claim": True,
    },
    "Order Manager": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
        "export": True,
        "print_claim": True,
    },
    "Logistic Manager": {
        "view": False,
        "add": False,
        "change": False,
        "delete": False,
        "export": False,
        "print_claim": False,
    },
    "Accountant": {
        "view": True,
        "add": True,
        "change": True,
        "delete": True,
        "export": True,
        "print_claim": True,
    },
}


REPAIR_PERMISSIONS: Final[dict[str, str]] = {
    "view": "view_repairrequest",
    "add": "add_repairrequest",
    "change": "change_repairrequest",
    "delete": "delete_repairrequest",
    "export": "export_repairrequest",
    "print_claim": "print_repairrequest_claim",
}


HTTP_METHODS: Final[dict[str, str]] = {
    "view": "GET",
    "add": "POST",
    "change": "PATCH",
    "delete": "DELETE",
}


class TestRepairRequestPermissionMatrix(APITestCase):
    """
    Verifies the RepairRequest permission matrix for all application roles.
    """

    list_url = "/api/repair/requests/"

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

        username = "repair_permission_" + role.lower().replace(" ", "_").replace(
            "-", "_"
        )

        user = user_model.objects.create_user(
            username=username,
            password="test_password",
        )

        group = Group.objects.get(name=role)
        user.groups.add(group)

        return user

    def _create_repair_company(self) -> RepairCompany:
        company, _ = RepairCompany._default_manager.get_or_create(
            name="Permission Test Company",
        )

        return company

    def _create_repair_request(self) -> RepairRequest:
        company = self._create_repair_company()
        construction_object = ConstructionObjectFactory.create()

        return RepairRequest._default_manager.create(
            repair_company=company,
            construction_object=construction_object,
            location="site",
            status="open",
            description="Permission matrix test",
        )

    def _create_payload(self) -> dict[str, Any]:
        company = self._create_repair_company()
        construction_object = ConstructionObjectFactory.create()

        return {
            "repair_company": company.pk,
            "construction_object": construction_object.pk,
            "location": "site",
            "status": "open",
            "description": "Permission matrix test",
            "closing_description": "",
        }

    def _request_action(
        self,
        action: str,
    ) -> Any:
        if action == "add":
            return self.client.post(
                self.list_url,
                self._create_payload(),
                format="json",
            )

        repair_request = self._create_repair_request()

        detail_url = f"{self.list_url}" f"{repair_request.pk}/"

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

    @staticmethod
    def _print_permission_result(
        *,
        role: str,
        action: str,
        allowed: bool,
    ) -> None:
        result = "ALLOWED" if allowed else "FORBIDDEN"

        print(f"    ✓ {role:<18} | " f"{action:<12} | " f"{result}")

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

    def test_group_repair_permission_matrix(self) -> None:
        """
        Check actual Django permissions assigned to every role.
        """

        print("\n=== REPAIR REQUEST GROUP PERMISSION MATRIX ===")

        for role, expected_permissions in ROLE_MATRIX.items():
            user = self._create_user_for_role(role)

            for action, expected in expected_permissions.items():
                with self.subTest(
                    role=role,
                    action=action,
                ):
                    codename = REPAIR_PERMISSIONS[action]

                    actual = user.has_perm(
                        f"repairs.{codename}",
                    )

                    self.assertEqual(
                        actual,
                        expected,
                        (
                            f"{role}: repairs.{codename} "
                            f"expected={expected}, "
                            f"actual={actual}"
                        ),
                    )

                    self._print_permission_result(
                        role=role,
                        action=action,
                        allowed=actual,
                    )

    def test_repair_request_api_permission_matrix(
        self,
    ) -> None:
        """
        Check RepairRequest CRUD endpoints for every role.
        """

        print("\n=== REPAIR REQUEST API PERMISSION MATRIX ===")

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
