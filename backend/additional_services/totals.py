"""Currency arithmetic for specification rows and financial reports."""

from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal
from typing import TYPE_CHECKING, NotRequired, TypedDict, cast

if TYPE_CHECKING:
    from .models import AdditionalServiceItem

CENT = Decimal("0.01")
ZERO = Decimal("0.00")
CATEGORIES = ("transport", "specialist")


class MoneyTotals(TypedDict):
    """Costs, charges and the difference between them."""

    cost: Decimal
    charge: Decimal
    margin: Decimal


class CategoryTotals(MoneyTotals):
    """Monetary totals and the number of specification rows in a category."""

    count: int


class FinancialTotals(MoneyTotals):
    """Monetary totals across all categories and for each category."""

    by_category: dict[str, CategoryTotals]


class ReportTotals(FinancialTotals):
    """Financial totals and the number of requests included in a report."""

    count: int


class FormattedMoneyTotals(TypedDict):
    """Monetary totals formatted as two-decimal strings for the API."""

    cost: str
    charge: str
    margin: str


class FormattedCategoryTotals(FormattedMoneyTotals):
    """Formatted monetary totals and a category's specification row count."""

    count: int


class FormattedFinancialTotals(FormattedMoneyTotals):
    """Formatted totals with category subtotals and an optional request count."""

    by_category: dict[str, FormattedCategoryTotals]
    count: NotRequired[int]


def money(value: Decimal) -> Decimal:
    """Round a monetary amount to cents using half-up rounding."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_totals(items: Iterable["AdditionalServiceItem"]) -> FinancialTotals:
    """Sum row-rounded costs and rebillable charges, including category subtotals."""
    rows: dict[str, CategoryTotals] = {
        category: {"cost": ZERO, "charge": ZERO, "margin": ZERO, "count": 0}
        for category in CATEGORIES
    }
    for item in items:
        quantity = item.quantity
        cost = money(quantity * item.cost_per_unit)
        charge = money(quantity * item.price_per_unit) if item.is_rebillable else ZERO
        row = rows[item.category]
        row["cost"] += cost
        row["charge"] += charge
        row["count"] += 1

    cost = rows["transport"]["cost"] + rows["specialist"]["cost"]
    charge = rows["transport"]["charge"] + rows["specialist"]["charge"]
    for row in rows.values():
        row["margin"] = row["charge"] - row["cost"]
    return {
        "cost": cost,
        "charge": charge,
        "margin": charge - cost,
        "by_category": rows,
    }


def composition(items: Iterable["AdditionalServiceItem"]) -> str:
    """Classify the request by which specification categories are present."""
    kinds = {item.category for item in items}
    if kinds == {"transport", "specialist"}:
        return "both"
    if kinds == {"transport"}:
        return "transport_only"
    if kinds == {"specialist"}:
        return "specialist_only"
    return "none"


def formatted_totals(
    result: FinancialTotals | ReportTotals,
) -> FormattedFinancialTotals:
    """Render money as two-decimal strings and keep counts as integers."""

    def section(part: MoneyTotals) -> FormattedMoneyTotals:
        """Format the monetary fields shared by totals and subtotals."""
        return {
            "cost": f'{part["cost"]:.2f}',
            "charge": f'{part["charge"]:.2f}',
            "margin": f'{part["margin"]:.2f}',
        }

    formatted: FormattedFinancialTotals = {
        **section(result),
        "by_category": {
            key: {**section(value), "count": value["count"]}
            for key, value in result["by_category"].items()
        },
    }
    if "count" in result:
        formatted["count"] = cast(ReportTotals, result)["count"]
    return formatted
