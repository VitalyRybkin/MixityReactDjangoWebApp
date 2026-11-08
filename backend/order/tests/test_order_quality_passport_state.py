"""Verify quality-passport state previews, permissions, and query validation."""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse

from catalog.api.routes import QualityPassportRoutes
from catalog.services.quality_passports import QualityPassportsService
from order.models import Order
from order.tests.quality_passport_test_base import QualityPassportTestBase


class TestOrderQualityPassportState(QualityPassportTestBase):
    """Check projected consumption and issuance availability without changing orders."""

    __test__ = True

    def test_passport_state_preview_new_position(self) -> None:
        """Verify a new-position preview adds consumption to the latest passport."""
        self._logger_header(
            f"ENDPOINT GET: catalog:{QualityPassportRoutes.STATE.path} - PASSPORT STATE: NEW POSITION"
        )

        self._activate_order()

        quantity = self._exceeding_quantity()
        used = QualityPassportsService.used_quantity(self.passport)

        response = self.client.get(
            reverse(f"catalog:{QualityPassportRoutes.STATE.name}"),
            {
                "product_id": self.product.pk,
                "quantity": str(quantity),
                "target_status": Order.Status.CREATED,
            },
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            response.data["passport"]["id"],
            self.passport.pk,
        )

        self.assertGreater(
            Decimal(response.data["projected_used_quantity"]),
            used,
        )

        self.assertTrue(response.data["is_latest"])

        self._logger_success(
            "passport_state",
            "New position preview calculated",
        )

    def test_passport_state_preview_replaces_old_quantity(self) -> None:
        """Verify an existing-position preview replaces its quantity and preserves its link."""
        self._logger_header(
            f"ENDPOINT GET: catalog:{QualityPassportRoutes.STATE.path} - PASSPORT STATE: REPLACE QUANTITY"
        )

        self._activate_order()
        self.item.refresh_from_db()

        quantity = self._exceeding_quantity()

        used = QualityPassportsService.used_quantity(self.passport)
        old_tons = QualityPassportsService.item_quantity_tons(self.item)

        new_tons = Decimal(str(quantity))

        if self.product.is_piece_based:
            new_tons = (
                new_tons * Decimal(self.product.unit_config.value) / Decimal("1000")
            )

        expected = used - old_tons + new_tons

        response = self.client.get(
            reverse(f"catalog:{QualityPassportRoutes.STATE.name}"),
            {
                "product_id": self.product.pk,
                "order_id": self.order.pk,
                "quantity": str(quantity),
                "target_status": Order.Status.CREATED,
            },
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(
            Decimal(response.data["projected_used_quantity"]),
            expected,
        )

        self.item.refresh_from_db()
        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        self._logger_success(
            "passport_state",
            "Existing quantity replaced without double counting",
        )

    def test_historical_passport_cannot_be_updated(self) -> None:
        """Verify a historical passport preview identifies the latest and disallows renewal."""
        self._logger_header(
            f"ENDPOINT GET: catalog:{QualityPassportRoutes.STATE.path} - PASSPORT STATE: HISTORICAL"
        )

        self._activate_order()
        new_passport = self._issue_new_passport()

        response = self.client.get(
            reverse(f"catalog:{QualityPassportRoutes.STATE.name}"),
            {
                "product_id": self.product.pk,
                "order_id": self.order.pk,
                "quantity": str(self._exceeding_quantity()),
                "target_status": Order.Status.CREATED,
            },
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(
            response.data["passport"]["id"],
            self.passport.pk,
        )
        self.assertEqual(
            response.data["latest_passport_id"],
            new_passport.pk,
        )
        self.assertFalse(response.data["is_latest"])
        self.assertFalse(response.data["can_issue_new_passport"])

        self._logger_success(
            "passport_state",
            "Historical passport remains visible and cannot be renewed",
        )

    def test_state_permissions(self) -> None:
        """Verify order-view access and add-order permission for passport issuance."""
        self._logger_header(
            f"ENDPOINT GET: catalog:{QualityPassportRoutes.STATE.path} - PASSPORT STATE: PERMISSIONS"
        )

        url = reverse(f"catalog:{QualityPassportRoutes.STATE.name}")

        params = {
            "product_id": self.product.pk,
            "quantity": "40000.00",
            "target_status": Order.Status.CREATED,
        }

        cases = [
            ([], 403, None),
            (["view_order"], 200, False),
            (["view_order", "add_order"], 200, True),
        ]

        for index, (permissions, expected_status, can_issue) in enumerate(cases):
            with self.subTest(permissions=permissions):
                user = get_user_model().objects.create_user(
                    username=f"passport_state_user_{index}",
                    password="test_password",
                )

                for codename in permissions:
                    permission = Permission.objects.get(
                        content_type__app_label="order",
                        codename=codename,
                    )
                    user.user_permissions.add(permission)

                self.client.force_authenticate(user=user)

                response = self.client.get(url, params)

                self.assertEqual(
                    response.status_code,
                    expected_status,
                    response.data,
                )

                if can_issue is not None:
                    self.assertEqual(
                        response.data["can_issue_new_passport"],
                        can_issue,
                    )

        self._logger_success(
            "permissions",
            "STATE access and issue permissions verified",
        )

    def test_state_invalid_query_parameters(self) -> None:
        """Reject invalid quantities with 400 and a nonexistent product with 404."""
        self._logger_header(
            f"ENDPOINT GET: catalog:{QualityPassportRoutes.STATE.path} - PASSPORT STATE: INVALID PARAMETERS"
        )

        url = reverse(f"catalog:{QualityPassportRoutes.STATE.name}")

        for quantity in ("-10", "0", "1.234", "invalid"):
            with self.subTest(quantity=quantity):
                response = self.client.get(
                    url,
                    {
                        "product_id": self.product.pk,
                        "quantity": quantity,
                        "target_status": Order.Status.CREATED,
                    },
                )

                self.assertEqual(response.status_code, 400, response.data)

        response = self.client.get(
            url,
            {"product_id": 999999999},
        )

        self.assertEqual(response.status_code, 404)

        self._logger_success(
            "validation",
            "Invalid quantities and missing product rejected",
        )
