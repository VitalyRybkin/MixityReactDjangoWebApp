"""Quality passport issuance tests."""

from decimal import Decimal

from catalog.models import QualityPassport
from catalog.tests.api.factories import QualityPassportFactory
from order.tests.quality_passport_test_base import QualityPassportTestBase


class TestOrderQualityPassportIssuance(QualityPassportTestBase):
    __test__ = True

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

        if self.product.is_piece_based:
            item_tons = (
                Decimal(str(quantity))
                * Decimal(self.product.unit_config.value)
                / Decimal("1000")
            )
        else:
            item_tons = Decimal(str(quantity))

        # Для навальной продукции округляем вверх до 0.100 т.
        if not self.product.is_piece_based:
            from decimal import ROUND_CEILING

            step = Decimal("0.100")
            item_tons = (item_tons / step).to_integral_value(
                rounding=ROUND_CEILING
            ) * step

        new_quantity = item_tons * Decimal("2")

        count_before = QualityPassport.objects.count()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    {
                        **self._product_payload(quantity),
                        "new_quality_passport": self._new_passport_data(new_quantity),
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
