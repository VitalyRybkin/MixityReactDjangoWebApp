from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request


class OrderResourcesPermission(BasePermission):
    def has_permission(
        self,
        request: Request,
        view: Any,
    ) -> bool:
        return request.user.has_perm("order.add_order") or request.user.has_perm(
            "order.change_order"
        )


class OrderExportPermission(BasePermission):
    required_permission = "order.export_order"

    def has_permission(
        self,
        request: Request,
        view: Any,
    ) -> bool:
        return request.user.has_perm(self.required_permission)
