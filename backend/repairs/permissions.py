from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class RepairRequestExportPermission(BasePermission):
    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.has_perm("repairs.export_repairrequest")
        )
