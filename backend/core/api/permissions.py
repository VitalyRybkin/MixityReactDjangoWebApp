from typing import Any

from rest_framework.permissions import BasePermission, DjangoModelPermissions
from rest_framework.request import Request


class StrictDjangoModelPermissions(DjangoModelPermissions):
    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": [],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }


class OrderUpdPermission(BasePermission):
    message = "У вас нет прав для работы с УПД."

    def has_permission(
        self,
        request: Request,
        view: Any,
    ) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.has_perm("order.manage_order_upd")
        )


class OrderViewPermission(BasePermission):
    def has_permission(
        self,
        request: Request,
        view: Any,
    ) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.has_perm("order.view_order")
        )