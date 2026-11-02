from typing import Any, Final

from core.tests.permission_matrix_test_case import BasePermissionMatrixTestCase
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


class TestRepairRequestPermissionMatrix(BasePermissionMatrixTestCase):
    """
    Verifies the RepairRequest permission matrix for all application roles.
    """

    __test__ = True

    app_label = "repairs"
    role_matrix = ROLE_MATRIX
    permission_codenames = REPAIR_PERMISSIONS

    def create_object(self) -> RepairRequest:
        company, _ = RepairCompany.objects.get_or_create(
            name="Permission Test Company",
        )

        return RepairRequest._default_manager.create(
            repair_company=company,
            construction_object=ConstructionObjectFactory(),
            location="site",
            status="open",
            description="Permission matrix test",
        )

    def get_create_url(self) -> str:
        return "/api/repair/requests/"

    def get_detail_url(self, obj: RepairRequest) -> str:
        return f"/api/repair/requests/{obj.pk}/"

    def get_create_payload(self) -> dict[str, Any]:
        obj = self.create_object()

        return {
            "repair_company": obj.repair_company.pk,
            "construction_object": obj.construction_object.pk,
            "location": "site",
            "status": "open",
            "description": "Permission matrix test",
            "closing_description": "",
        }

    def get_update_payload(self) -> dict:
        return {
            "description": "Updated by permission test",
        }
