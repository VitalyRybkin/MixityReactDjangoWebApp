from django.urls import reverse

from catalog.api.routes import QualityPassportRoutes
from catalog.models import QualityPassport
from catalog.tests.api.factories import QualityPassportFactory
from core.tests.permission_matrix_test_case import BasePermissionMatrixTestCase

PASSPORT_ROLE_MATRIX = {
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

PASSPORT_PERMISSIONS = {
    "view": "view_qualitypassport",
    "add": "add_qualitypassport",
    "change": "change_qualitypassport",
    "delete": "delete_qualitypassport",
}


class TestQualityPassportPermissionMatrix(BasePermissionMatrixTestCase):
    __test__ = True

    app_label = "catalog"
    role_matrix = PASSPORT_ROLE_MATRIX
    permission_codenames = PASSPORT_PERMISSIONS

    def create_object(self) -> QualityPassport:
        return QualityPassportFactory.create()

    def get_create_url(self) -> str:
        return reverse(f"catalog:{QualityPassportRoutes.CREATE.name}")

    def get_detail_url(self, obj: QualityPassport) -> str:
        return reverse(
            f"catalog:{QualityPassportRoutes.DETAIL.name}",
            kwargs={"pk": obj.pk},
        )

    def get_create_payload(self) -> dict:
        passport = self.create_object()

        return {
            "product": passport.product_id,
            "number": f"{passport.number}-NEW",
            "issue_date": passport.issue_date.isoformat(),
            "batch_number": passport.batch_number,
            "production_date": passport.production_date.isoformat(),
            "quantity": str(passport.quantity),
        }

    def get_update_payload(self) -> dict:
        return {
            "batch_number": "Updated-Batch",
        }
