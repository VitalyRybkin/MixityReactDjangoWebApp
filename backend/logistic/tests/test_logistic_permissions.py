from typing import Any, Final

from django.db.models import Model
from django.urls import reverse
from rest_framework import status

from core.tests.permission_matrix_test_case import BasePermissionMatrixTestCase
from logistic.models import (
    Carrier,
    Driver,
    Truck,
    TruckCapacity,
    TruckType,
)
from logistic.routes import CarrierRoutes
from logistic.tests.factories import CarrierFactory

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


LOGISTIC_MODELS: Final[tuple[type[Model], ...]] = (
    Carrier,
    Driver,
    Truck,
    TruckCapacity,
    TruckType,
)


class TestLogisticPermissionMatrix(BasePermissionMatrixTestCase):
    __test__ = True

    app_label = "logistic"
    role_matrix = ROLE_MATRIX
    permission_models = LOGISTIC_MODELS

    def create_object(self) -> Carrier:
        return CarrierFactory.create()

    def get_create_url(self) -> str:
        return reverse(f"logistic:{CarrierRoutes.LIST_CREATE.name}")

    def get_detail_url(self, obj: Carrier) -> str:
        return reverse(
            f"logistic:{CarrierRoutes.DETAIL.name}",
            args=[obj.pk],
        )

    def get_create_payload(self) -> dict[str, Any]:
        carrier = CarrierFactory.build()

        return {
            "name": carrier.name,
            "organization": carrier.organization,
            "address": carrier.address,
            "description": carrier.description,
            "phone": str(carrier.phone),
        }

    def get_update_payload(self) -> dict[str, Any]:
        return {
            "description": "Updated by permission test",
        }

    def expected_status(
        self,
        action: str,
        allowed: bool,
    ) -> int:
        if action == "delete" and allowed:
            return status.HTTP_200_OK

        return super().expected_status(action, allowed)
