from typing import Any, Final

from django.urls import reverse
from rest_framework import status

from core.tests.permission_matrix_test_case import (
    BasePermissionMatrixTestCase,
)
from stock.models import Warehouse
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


class TestStockPermissionMatrix(BasePermissionMatrixTestCase):
    __test__ = True

    app_label = "stock"
    role_matrix = ROLE_MATRIX
    permission_codenames = STOCK_PERMISSIONS

    def create_object(self) -> Warehouse:
        return WarehouseFactory.create()

    def get_create_url(self) -> str:
        return reverse(f"stock:{WarehouseRoutes.LIST_CREATE.name}")

    def get_detail_url(self, obj: Warehouse) -> str:
        return reverse(
            f"stock:{WarehouseRoutes.DETAIL.name}",
            args=[obj.pk],
        )

    def get_create_payload(self) -> dict[str, Any]:
        warehouse = WarehouseFactory.build()

        return {
            "name": warehouse.name,
            "organization": warehouse.organization,
            "address": warehouse.address,
            "phone": str(warehouse.phone),
        }

    def get_update_payload(self) -> dict[str, Any]:
        return {
            "address": "Updated by permission test",
        }

    def expected_status(
        self,
        action: str,
        allowed: bool,
    ) -> int:
        if action == "delete" and allowed:
            return status.HTTP_200_OK

        return super().expected_status(action, allowed)
