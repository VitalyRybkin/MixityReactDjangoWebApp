"""Quality passport lifecycle tests."""

from decimal import Decimal

from catalog.services.quality_passports import QualityPassportsService
from order.models import Order
from order.tests.quality_passport_test_base import QualityPassportTestBase


class TestOrderQualityPassportLifecycle(QualityPassportTestBase):
    __test__ = True

    def test_draft_does_not_assign_passport(self) -> None:
        """Verify drafts do not link passports and consume no quantity."""
        self._logger_header("DRAFT ORDER: DO NOT ASSIGN PASSPORT")
        response = self.client.patch(
            self.url,
            {
                "status": Order.Status.DRAFT,
                "products": [self._product_payload(10)],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()
        self.assertIsNone(self.item.quality_passport_id)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Draft has no passport and consumes no quantity | 200",
        )

    def test_draft_to_created_assigns_passport(self) -> None:
        """Verify a status-only transition assigns the latest passport and consumes quantity."""
        self._logger_header("DRAFT → CREATED: ASSIGN PASSPORT")
        response = self.client.patch(
            self.url,
            {"status": Order.Status.CREATED},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.order.refresh_from_db()
        self.item.refresh_from_db()

        self.assertEqual(self.order.status, Order.Status.CREATED)
        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Latest passport assigned and quantity consumed | 200",
        )

    def test_created_to_draft_releases_quantity(self) -> None:
        """Verify returning to draft clears the passport and releases its consumed quantity."""
        self._logger_header("CREATED → DRAFT: RELEASE PASSPORT QUANTITY")
        self.order.status = Order.Status.CREATED
        self.order.save()

        self.item.quality_passport = self.passport
        self.item.save(update_fields=["quality_passport"])

        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        response = self.client.patch(
            self.url,
            {"status": Order.Status.DRAFT},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()
        self.assertIsNone(self.item.quality_passport_id)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Status-only update clears passport and releases quantity | 200",
        )

    def test_new_passport_does_not_replace_historical(self) -> None:
        """Verify issuing a newer passport does not replace an existing item assignment."""
        self._logger_header("HISTORICAL PASSPORT")

        self._activate_order()

        new_passport = self._issue_new_passport()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    self._product_payload(10),
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()

        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        self.assertEqual(
            QualityPassportsService.used_quantity(new_passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Historical passport preserved",
        )

    def test_update_quantity_does_not_double_count(self) -> None:
        """Verify quantity edits and repeated saves count the current item quantity only once."""
        self._logger_header("UPDATE QUANTITY WITHOUT DOUBLE COUNT")

        self._activate_order()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    self._product_payload(15),
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()

        expected = QualityPassportsService.item_quantity_tons(self.item)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            expected,
        )

        response = self.client.patch(
            self.url,
            {"description": "Repeated save"},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            expected,
        )

        self._logger_success(
            "used_quantity",
            "Quantity recalculated without double counting",
        )

    def test_delete_order_releases_passport_quantity(self) -> None:
        """Verify deleting an order removes its contribution to passport consumption."""
        self._logger_header("DELETE ORDER RELEASES QUANTITY")

        self._activate_order()

        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, 204)

        self.assertFalse(Order.objects.filter(pk=self.order.pk).exists())

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "used_quantity",
            "Order deleted and quantity released",
        )

    def test_manual_passport_selection_rejected(self) -> None:
        """Clients cannot assign either historical or latest passports directly."""
        self._logger_header("MANUAL PASSPORT SELECTION: REJECTED")

        self._activate_order()
        new_passport = self._issue_new_passport()
        old_id = self.item.quality_passport_id
        old_used = QualityPassportsService.used_quantity(self.passport)

        for passport_id in (self.passport.pk, new_passport.pk):
            with self.subTest(passport_id=passport_id):
                response = self.client.patch(
                    self.url,
                    {
                        "description": "Should be rejected",
                        "products": [
                            {
                                **self._product_payload(10),
                                "quality_passport": passport_id,
                            }
                        ],
                    },
                    format="json",
                )

                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn("products", response.data["errors"])
                self.assertIn(
                    "quality_passport",
                    response.data["errors"]["products"][0],
                )
                self.order.refresh_from_db()
                self.item.refresh_from_db()
                self.assertEqual(self.order.description, "Original description")
                self.assertEqual(self.item.quality_passport_id, old_id)
                self.assertEqual(
                    QualityPassportsService.used_quantity(self.passport),
                    old_used,
                )

        self._logger_success(
            "quality_passport",
            "Manual latest/historical assignment rejected | 400",
        )
