from typing import Any, Final

from catalog.models import Product
from catalog.tests.api.factories import ProductFactory
from core.tests.permission_matrix_test_case import BasePermissionMatrixTestCase

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


class TestCatalogPermissionMatrix(BasePermissionMatrixTestCase):
    __test__ = True

    app_label = "catalog"
    role_matrix = ROLE_MATRIX
    permission_codenames = CATALOG_PERMISSIONS

    api_actions = (
        "view",
        "change",
        "delete",
    )

    def create_object(self) -> Product:
        return ProductFactory.create()

    def get_create_url(self) -> str:
        return "/api/catalog/products/"

    def get_detail_url(self, obj: Product) -> str:
        return f"/api/catalog/products/{obj.pk}/"

    def get_create_payload(self) -> dict[str, Any]:
        raise NotImplementedError("Product POST permission test is not configured yet.")

    def get_update_payload(self) -> dict[str, Any]:
        return {
            "title": "Updated by permission test",
        }
