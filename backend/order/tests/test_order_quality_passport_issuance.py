"""Quality passport issuance tests."""

from datetime import timedelta
from decimal import ROUND_CEILING, Decimal

from catalog.models import QualityPassport
from catalog.tests.api.factories import QualityPassportFactory
from order.tests.quality_passport_test_base import QualityPassportTestBase


class TestOrderQualityPassportIssuance(QualityPassportTestBase):
    __test__ = True

    def _passport_quantity_covering(self, order_quantity: object) -> Decimal:
        """Return a valid passport quantity large enough for the order item."""
        item_tons = Decimal(str(order_quantity))

        if self.product.is_piece_based:
            item_tons *= Decimal(self.product.unit_config.value) / Decimal("1000")
        else:
            step = Decimal("0.100")
            item_tons = (item_tons / step).to_integral_value(
                rounding=ROUND_CEILING
            ) * step

        return item_tons * Decimal("2")

    def _assert_failed_issue_preserves_order(
        self,
        passport_data: dict,
        expected_error_field: str,
    ) -> None:
        """Assert an invalid issue does not persist order/item/passport changes."""
        quantity = self._exceeding_quantity()
        count_before = QualityPassport.objects.count()
        original_description = self.order.description
        original_passport_id = self.item.quality_passport_id
        original_piece_quantity = self.item.piece_based_quantity
        original_weight_quantity = self.item.weight_quantity

        response = self.client.patch(
            self.url,
            {
                "description": "Should be rolled back",
                "products": [
                    {
                        **self._product_payload(quantity),
                        "new_quality_passport": passport_data,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn(expected_error_field, str(response.data))
        self.assertEqual(QualityPassport.objects.count(), count_before)

        self.item.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.order.description, original_description)
        self.assertEqual(self.item.quality_passport_id, original_passport_id)
        self.assertEqual(self.item.piece_based_quantity, original_piece_quantity)
        self.assertEqual(self.item.weight_quantity, original_weight_quantity)

    def test_latest_passport_same_date_uses_highest_id(self) -> None:
        """Verify passports with equal issue dates are ordered by descending primary key."""
        self._logger_header("LATEST PASSPORT: SAME ISSUE DATE")

        new_passport = QualityPassportFactory.create(
            product=self.product,
            issue_date=self.passport.issue_date,
            quantity=Decimal("300.000"),
        )

        latest = QualityPassport.last_issued.get_latest_for_product(self.product)

        self.assertIsNotNone(latest)
        assert latest is not None
        self.assertEqual(latest.pk, new_passport.pk)

        self._logger_success(
            "quality_passport",
            "Same issue date: highest ID is the latest passport",
        )

    def test_issue_new_passport_during_order_update(self) -> None:
        """Verify an order update issues, links, and makes a new passport latest."""
        self._logger_header("ORDER: ISSUE NEW QUALITY PASSPORT")

        self._activate_order()

        quantity = self._exceeding_quantity()

        new_quantity = self._passport_quantity_covering(quantity)
        requested_issue_date = self.passport.issue_date + timedelta(days=2)
        requested_production_date = requested_issue_date - timedelta(days=1)
        # Boundary case: the passport may be issued on the delivery date.
        self.order.delivery_date = requested_issue_date
        self.order.save(update_fields=["delivery_date"])
        new_passport_data = self._new_passport_data(new_quantity)
        new_passport_data["issue_date"] = requested_issue_date.isoformat()
        new_passport_data["production_date"] = requested_production_date.isoformat()

        count_before = QualityPassport.objects.count()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    {
                        **self._product_payload(quantity),
                        "new_quality_passport": new_passport_data,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(
            QualityPassport.objects.count(),
            count_before + 1,
        )

        new_passport = QualityPassport.objects.get(number=f"{self.passport.number}-NEW")

        self.item.refresh_from_db()

        self.assertEqual(new_passport.issue_date, requested_issue_date)
        self.assertEqual(new_passport.production_date, requested_production_date)
        self.assertEqual(
            self.item.quality_passport_id,
            new_passport.pk,
        )

        latest = QualityPassport.last_issued.get_latest_for_product(self.product)

        assert latest is not None

        self.assertEqual(latest.pk, new_passport.pk)

        self._logger_success(
            "quality_passport",
            "New passport issued and linked to order item",
        )

    def test_passport_date_after_delivery_rejected_and_order_rolled_back(self) -> None:
        """Reject an explicitly chosen date after delivery without partial writes."""
        self._logger_header("ORDER: PASSPORT AFTER DELIVERY DATE")
        self._activate_order()
        delivery_date = self.passport.issue_date + timedelta(days=1)
        self.order.delivery_date = delivery_date
        self.order.save(update_fields=["delivery_date"])

        passport_data = self._new_passport_data(
            self._passport_quantity_covering(self._exceeding_quantity())
        )
        passport_data["issue_date"] = (delivery_date + timedelta(days=1)).isoformat()
        passport_data["production_date"] = delivery_date.isoformat()

        self._assert_failed_issue_preserves_order(passport_data, "issue_date")
        self._logger_success(
            "issue_date", "Later date rejected; order and passport unchanged"
        )

    def test_automatic_issue_date_after_delivery_is_rejected(self) -> None:
        """Legacy clients omitting issue_date must respect the delivery date."""
        from django.utils import timezone

        self._logger_header("ORDER: AUTO PASSPORT DATE AFTER DELIVERY")
        self._activate_order()
        self.order.delivery_date = timezone.localdate() - timedelta(days=1)
        self.order.save(update_fields=["delivery_date"])
        passport_data = self._new_passport_data(
            self._passport_quantity_covering(self._exceeding_quantity())
        )
        passport_data.pop("issue_date", None)

        self._assert_failed_issue_preserves_order(passport_data, "issue_date")
        self._logger_success(
            "issue_date", "Automatic date validated against delivery date"
        )

    def test_passport_date_checked_against_updated_delivery_date(self) -> None:
        """Check the newly submitted delivery date, not the old order value."""
        self._logger_header("ORDER: PASSPORT WITH RESCHEDULED DELIVERY")
        self._activate_order()
        issue_date = self.passport.issue_date + timedelta(days=2)
        self.order.delivery_date = issue_date + timedelta(days=1)
        self.order.save(update_fields=["delivery_date"])
        count_before = QualityPassport.objects.count()
        original_description = self.order.description
        old_delivery_date = self.order.delivery_date

        passport_data = self._new_passport_data(
            self._passport_quantity_covering(self._exceeding_quantity())
        )
        passport_data["issue_date"] = issue_date.isoformat()
        passport_data["production_date"] = issue_date.isoformat()
        response = self.client.patch(
            self.url,
            {
                "delivery_date": (issue_date - timedelta(days=1)).isoformat(),
                "description": "Should be rolled back",
                "products": [
                    {
                        **self._product_payload(self._exceeding_quantity()),
                        "new_quality_passport": passport_data,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("issue_date", str(response.data))
        self.assertEqual(QualityPassport.objects.count(), count_before)
        self.order.refresh_from_db()
        self.assertEqual(self.order.delivery_date, old_delivery_date)
        self.assertEqual(self.order.description, original_description)

        self._logger_success(
            "delivery_date", "Changed date validated; updates rolled back"
        )

    def test_earlier_issue_date_rejected_and_order_rolled_back(self) -> None:
        """A backdated issue is rejected after order writes, which roll back."""
        self._logger_header("ORDER: EARLIER PASSPORT ISSUE DATE")

        self._activate_order()
        invalid_issue_date = self.passport.issue_date - timedelta(days=1)
        passport_data = self._new_passport_data(
            self._passport_quantity_covering(self._exceeding_quantity())
        )
        passport_data["issue_date"] = invalid_issue_date.isoformat()
        passport_data["production_date"] = (
            invalid_issue_date - timedelta(days=1)
        ).isoformat()

        self._assert_failed_issue_preserves_order(passport_data, "issue_date")
        self._logger_success(
            "issue_date",
            "Earlier issue date rejected; order and passport unchanged",
        )

    def test_later_production_date_rejected_and_order_unchanged(self) -> None:
        """Reject production after issue at the API boundary without updating order."""
        self._logger_header("ORDER: LATER PASSPORT PRODUCTION DATE")

        self._activate_order()
        requested_issue_date = self.passport.issue_date + timedelta(days=1)
        passport_data = self._new_passport_data(
            self._passport_quantity_covering(self._exceeding_quantity())
        )
        passport_data["issue_date"] = requested_issue_date.isoformat()
        passport_data["production_date"] = (
            requested_issue_date + timedelta(days=1)
        ).isoformat()

        self._assert_failed_issue_preserves_order(passport_data, "production_date")
        self._logger_success(
            "production_date",
            "Later production date rejected; order and passport unchanged",
        )

    def test_failed_passport_issue_rolls_back_order(self) -> None:
        """Verify a duplicate passport number leaves passport count and order data unchanged."""
        self._logger_header("ORDER: PASSPORT ISSUE ROLLBACK")

        self._activate_order()

        count_before = QualityPassport.objects.count()
        original_passport_id = self.item.quality_passport_id

        passport_data = self._new_passport_data(Decimal("300.000"))
        passport_data["number"] = self.passport.number

        response = self.client.patch(
            self.url,
            {
                "description": "Should be rolled back",
                "products": [
                    {
                        **self._product_payload(self._exceeding_quantity()),
                        "new_quality_passport": passport_data,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)

        self.assertEqual(
            QualityPassport.objects.count(),
            count_before,
        )

        self.item.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            self.item.quality_passport_id,
            original_passport_id,
        )
        self.assertNotEqual(
            self.order.description,
            "Should be rolled back",
        )

        self._logger_success(
            "quality_passport",
            "Failed issue rolled back passport and order changes",
        )
