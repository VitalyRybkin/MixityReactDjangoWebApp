from typing import Any, Final

from django.urls import reverse

from contacts.factories import ContactFactory
from core.tests.permission_matrix_test_case import BasePermissionMatrixTestCase
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


class TestOrderPermissionMatrix(BasePermissionMatrixTestCase):
    __test__ = True

    app_label = "order"
    role_matrix = ROLE_MATRIX
    permission_codenames = ORDER_PERMISSIONS

    def create_object(self) -> Order:
        return OrderFactory.create()

    def get_create_url(self) -> str:
        return reverse(f"order_orders:{OrderRoutes.LIST_CREATE.name}")

    def get_detail_url(self, obj: Order) -> str:
        return reverse(
            f"order_orders:{OrderRoutes.DETAIL.name}",
            args=[obj.pk],
        )

    def get_create_payload(self) -> dict[str, Any]:
        order = OrderFactory.create()

        contact = ContactFactory.create(
            client=order.client,
            carrier=None,
        )

        return {
            "client": order.client_id,
            "customer": order.customer_id,
            "warehouse": order.warehouse_id,
            "delivery_date": order.delivery_date,
            "status": order.status,
            "contacts": [contact.pk],
        }

    def get_update_payload(self) -> dict[str, Any]:
        return {
            "status": Order.Status.CREATED,
            "contacts": [],
            "products": [],
        }
