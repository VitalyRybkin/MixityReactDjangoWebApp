from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, ClassVar
from unittest import SkipTest

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.tests.api.factories import ProductFactory
from contacts.factories import ContactFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.base_view_test_case import BaseViewTestCase
from core.tests.model_tests import ModelContractMixin
from core.tests.utils import TestLoggingMixin
from order.models import Order, OrderItem, PackType
from order.routes import OrderRoutes
from order.serializers.order_serializers.create_order_serializers import (
    OrderReadSerializer,
    OrderWriteSerializer,
)
from order.tests.factories import (
    ClientFactory,
    CustomerFactory,
    OrderDeliveryDataFactory,
    OrderFactory,
    OrderItemFactory,
    PackTypeFactory,
)
from order.views.orders import OrderListCreateAPIView, OrderRetrieveUpdateDestroyAPIView
from stock.tests.factories import WarehouseFactory


class TestOrderListCreateAPIView(BaseAPIMixin):
    __test__ = True
    url_name = f"order_orders:{OrderRoutes.LIST_CREATE.name}"
    factory = OrderFactory
    model = Order

    def test_create_order_no_data(self) -> None:
        self.client.force_authenticate(
            user=User.objects.create_user(username="testuser", password="")
        )
        self._create_logic(self.payload_generator()[0])

    def test_create_order(self) -> None:
        self.client.force_authenticate(
            user=User.objects.create_user(username="testuser", password="")
        )

        payload, temp_order = self.payload_generator()
        delivery_data = OrderDeliveryDataFactory.create(order=temp_order)
        delivery = {"order": delivery_data.order.id}
        payload["delivery"] = delivery

        products = OrderItemFactory.create_batch(3, order=temp_order)
        payload["products"] = [
            {
                "product": item.product.id,
                "quantity": str(item.weight_quantity),
                "package": item.pack_type.id,
                "price_at_sale": item.price_at_sale,
                "price_at_purchase": str(item.price_at_purchase),
            }
            for item in products
        ]

        self._create_logic(payload)

    def payload_generator(self) -> tuple[dict[str, list[Any] | Any], Any]:
        """Generates a payload for order creation tests."""
        temp = self.factory.create()
        contacts = ContactFactory.create_batch(3, client=temp.client, carrier=None)

        return (
            {
                "client": temp.client.id,
                "customer": temp.customer.id,
                "warehouse": temp.warehouse.id,
                "delivery_date": temp.delivery_date,
                "status": temp.status,
                "contacts": [contact.id for contact in contacts],
            },
            temp,
        )


class BaseOrderSerializersTestCase(BaseViewTestCase):
    """
    Test case for view serializer classes.

    Attributes:
        _view_class: The view class being tested.
        _cases: A list of test cases, each consisting of a method and its
            expected serializer.

    Methods:
        test_serializer_classes:
            Tests the serializer class for each method and its corresponding
            expected serializer.
    """

    __test__ = False
    _cases = []

    def test_serializer_classes(self) -> None:
        for method, serializer in self._cases:
            with self.subTest(method=method):
                self._assert_serializer_class(
                    method=method,
                    expected_serializer=serializer,
                )


class TestOrderRetrieveUpdateDestroySerializers(
    BaseOrderSerializersTestCase, BaseViewTestCase
):
    """
    Test case for verifying the behavior of the
    OrderRetrieveUpdateDestroyAPIView with various HTTP methods.
    """

    __test__ = True
    _view_class = OrderRetrieveUpdateDestroyAPIView
    _cases = [
        ("GET", OrderReadSerializer),
        ("PUT", OrderWriteSerializer),
        ("PATCH", OrderWriteSerializer),
        ("DELETE", OrderReadSerializer),
    ]


class TestOrderListCreateSerializers(BaseOrderSerializersTestCase, BaseViewTestCase):
    """Test class for verifying OrderListCreateAPIView behavior."""

    __test__ = True
    _view_class = OrderListCreateAPIView
    _cases = [
        ("GET", OrderReadSerializer),
        ("POST", OrderWriteSerializer),
    ]


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
                    "customer": customers[1].id,
                },
            ),
        ]

        for case in filter_cases:
            with self.subTest(params=case.params):
                self._assert_filtered_count(
                    expected_count=case.expected_count,
                    params=case.params,
                )


class TestOrderResourcesAPIView(APITestCase, TestLoggingMixin):
    """
    Test suite for validating the behavior of the order resources API endpoint.

    Args:
        url_name: The name of the API endpoint route for fetching order resources.
        AMOUNT_OF_RESOURCES: The number of resources created for test setup and
            validation purposes.
    """

    url_name = f"order_orders:{OrderRoutes.RESOURCES.name}"
    AMOUNT_OF_RESOURCES: ClassVar[int] = 3

    def test_order_resources(self) -> None:
        """Test the order resources API endpoint."""
        ClientFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        CustomerFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        ProductFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        WarehouseFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        PackTypeFactory.create_batch(self.AMOUNT_OF_RESOURCES)

        url = reverse(self.url_name)

        self._logger_header(f"ENDPOINT GET: {url}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_resources = {
            "clients": self.AMOUNT_OF_RESOURCES,
            "customers": self.AMOUNT_OF_RESOURCES,
            "products": self.AMOUNT_OF_RESOURCES,
            "warehouses": self.AMOUNT_OF_RESOURCES,
            "pack_types": self.AMOUNT_OF_RESOURCES,
        }

        for resource_name, expected_count in expected_resources.items():
            with self.subTest(resource=resource_name):
                self.assertIn(resource_name, response.data)
                self.assertEqual(len(response.data[resource_name]), expected_count)

                for item in response.data[resource_name]:
                    self.assertIn("id", item)

                print(
                    f"    {self.COLOR['OK']}✓ "
                    f"{resource_name} and id's are available in response, expected amount received."
                    f"{self.COLOR['END']}"
                )

    def test_order_resources_returns_only_active_items(self) -> None:
        """Test the order resources API endpoint returns only active items."""
        ClientFactory.create_batch(self.AMOUNT_OF_RESOURCES, is_active=True)
        ClientFactory.create_batch(2, is_active=False)

        url = reverse(self.url_name)
        self._logger_header(f"ENDPOINT GET (CHECK ACTIVE ONLY): {url}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["clients"]), self.AMOUNT_OF_RESOURCES)

        print(
            f"    {self.COLOR['OK']}✓ "
            f"Only active clients are returned in response."
            f"{self.COLOR['END']}"
        )


@pytest.mark.django_db
class TestPackType(APITestCase, ModelContractMixin, TestLoggingMixin):
    """Test suite for validating the behavior of the pack type model."""

    factory = PackTypeFactory
    model = PackType

    def setUp(self) -> None:
        if self.factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No resource found for testing.")

        self.obj = self.factory.create()

    def test_pack_type_str_method(self) -> None:
        """Test the pack type model's __str__ method."""
        pack_type = self.obj
        self._str_method_logic(pack_type.name)


@pytest.mark.django_db
class TestOrderItem(APITestCase, ModelContractMixin, TestLoggingMixin):
    """Test suite for validating the behavior of the order item model."""

    factory = OrderItemFactory
    model = OrderItem

    def setUp(self) -> None:
        if self.factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No resource found for testing.")

        self.obj = self.factory.create()

    def test_pack_type_str_method(self) -> None:
        """Test str method for OrderItem model."""
        order_item = self.obj
        self._str_method_logic(
            f"Order {order_item.order.id} - Product {order_item.product.name}"
        )

    def test_get_total_price_for_weight_based_product(self) -> None:
        """Test the get_total_price method for a weight-based product."""
        self.obj = self.factory.create(
            piece_based_quantity=None,
            weight_quantity=Decimal("2.50"),
            price_at_purchase=Decimal("10.00"),
        )
        self._get_total_logic(Decimal("25.00"))

    def test_get_total_price_for_piece_based_product(self) -> None:
        """Test the get_total_price method for a piece-based product."""
        self.obj = self.factory.create(
            piece_based_quantity=5,
            weight_quantity=None,
            price_at_purchase=Decimal("10.00"),
        )
        self._get_total_logic(Decimal("50.00"))

    def test_get_total_price_when_no_purchase_price(self) -> None:
        """Test the get_total_price method when no purchase price is set."""
        self.obj = self.factory.create(
            piece_based_quantity=5, weight_quantity=None, price_at_purchase=None
        )
        self._get_total_logic(Decimal("0.00"))
