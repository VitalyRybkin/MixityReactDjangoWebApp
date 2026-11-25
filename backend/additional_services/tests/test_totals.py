"""Test the arithmetic used for additional service totals."""

from decimal import Decimal

from django.test import SimpleTestCase

from additional_services.models import AdditionalServiceItem
from additional_services.totals import calculate_totals
from core.tests.utils import TestLoggerMixin


class TestAdditionalServiceTotals(SimpleTestCase, TestLoggerMixin):
    """Verify financial totals using unsaved specification rows."""

    def test_money_rounding_is_per_row(self) -> None:
        """Round each row to cents before adding the rows together."""
        self._logger_header("TOTALS: per-row currency rounding")
        rows = [
            AdditionalServiceItem(
                category="transport",
                quantity=Decimal("0.333"),
                cost_per_unit=Decimal("1.00"),
                price_per_unit=Decimal("2.00"),
                is_rebillable=True,
            ),
            AdditionalServiceItem(
                category="transport",
                quantity=Decimal("0.333"),
                cost_per_unit=Decimal("1.00"),
                price_per_unit=Decimal("2.00"),
                is_rebillable=True,
            ),
        ]
        totals = calculate_totals(rows)
        self.assertEqual(totals["cost"], Decimal("0.66"))
        self.assertEqual(totals["charge"], Decimal("1.34"))
        self._logger_success(
            "Amounts rounded before summing",
            f'Cost {totals["cost"]}, charge {totals["charge"]}',
        )
