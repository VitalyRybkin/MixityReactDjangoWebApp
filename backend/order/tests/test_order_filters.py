from dataclasses import dataclass
from datetime import date, timedelta

from core.tests.base_test_case import BaseAPIMixin
from order.models import Order
from order.routes import OrderRoutes
from order.tests.factories import CustomerFactory, OrderFactory


@dataclass(frozen=True, slots=True)
class FilterCase:
    expected_count: int
    params: dict


class TestOrderFilteredAPIListCreate(BaseAPIMixin):
    """
    TestOrderFilteredAPIListCreate performs tests for listing and creating orders
    with filtering functionality.

    Args:
        url_name: The name of the API endpoint route for fetching order resources.
        factory: The factory class used to create order objects.
    """

    __test__ = True

    url_name = f"order_orders:{OrderRoutes.LIST_CREATE.name}"
    factory = OrderFactory

    permission_model = Order

    def test_filter_by_params(self) -> None:
        Order.objects.all().delete()

        num_of_days = 5
        customers = [
            CustomerFactory.create(),
            CustomerFactory.create(),
        ]

        for day_offset in range(num_of_days):
            for customer in customers:
                self.factory.create(
                    delivery_date=date.today() + timedelta(days=day_offset),
                    customer=customer,
                )

        filter_cases = [
            FilterCase(
                expected_count=10,
                params={},
            ),
            FilterCase(
                expected_count=10,
                params={
                    "date_from": date.today(),
                },
            ),
            FilterCase(
                expected_count=10,
                params={
                    "date_to": date.today() + timedelta(days=num_of_days - 1),
                },
            ),
            FilterCase(
                expected_count=4,
                params={
                    "date_from": date.today(),
                    "date_to": date.today() + timedelta(days=1),
                },
            ),
            FilterCase(
                expected_count=5,
                params={
                    "status": Order.Status.DRAFT,
                },
            ),
            FilterCase(
                expected_count=5,
                params={
                    "customer_id": customers[1].id,
                },
            ),
        ]

        for case in filter_cases:
            with self.subTest(params=case.params):
                self._assert_filtered_count(
                    expected_count=case.expected_count,
                    params=case.params,
                )
