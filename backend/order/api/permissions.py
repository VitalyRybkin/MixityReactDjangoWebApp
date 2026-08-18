from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request


class OrderResourcesPermission(BasePermission):
    required_permissions = (
        "order.view_client",
        "order.view_customer",
        "catalog.view_product",
        "stock.view_warehouse",
        "order.view_packtype",
    )

    def has_permission(
        self,
        request: Request,
        view: Any,
    ) -> bool:
        return request.user.has_perms(
            self.required_permissions,
        )
