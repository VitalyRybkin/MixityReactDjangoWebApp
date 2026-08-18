from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request


class CarrierResourcesPermission(BasePermission):
    required_permissions = (
        "logistic.view_carrier",
        "logistic.view_driver",
        "logistic.view_truck",
    )

    def has_permission(
        self,
        request: Request,
        view: Any,
    ) -> bool:
        return request.user.has_perms(self.required_permissions)
