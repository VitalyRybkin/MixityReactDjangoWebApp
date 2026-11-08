"""Verify quality-passport permissions for configured roles and API actions."""

from django.urls import reverse
from rest_framework import status

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
    """Check role grants and endpoint access using the shared permission matrix."""

    __test__ = True

    app_label = "catalog"
    permission_matrix_label = "QUALITY PASSPORT"
    role_matrix = PASSPORT_ROLE_MATRIX
    permission_codenames = PASSPORT_PERMISSIONS
    api_actions = ("view",)

    def create_object(self) -> QualityPassport:
        """Create a passport fixture for a permission check."""
        return QualityPassportFactory.create()

    def get_detail_url(self, obj: QualityPassport) -> str:
        """Return the detail endpoint for the supplied passport."""
        return reverse(
            f"catalog:{QualityPassportRoutes.DETAIL.name}",
            kwargs={"pk": obj.pk},
        )

    def get_create_payload(self) -> dict:
        """Build valid passport data with a new number for the same product."""
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
        """Build a batch-number update for the shared change-permission check."""
        return {
            "batch_number": "Updated-Batch",
        }

    def test_passport_write_methods_disabled(self) -> None:
        """
        Test that PUT/PATCH/DELETE methods are disabled for quality passports.
        """
        self._logger_header("PASSPORT: WRITE METHODS DISABLED")

        user = self.create_user_for_role("Admins")
        self.client.force_authenticate(user=user)

        passport = QualityPassportFactory.create()

        url = reverse(
            f"catalog:{QualityPassportRoutes.DETAIL.name}",
            args=[passport.pk],
        )

        for method in ("put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    url,
                    {},
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_405_METHOD_NOT_ALLOWED,
                    response.data,
                )

                self._logger_success(
                    "quality_passport",
                    f"{method.upper()} disabled | 405",
                )
