from decimal import Decimal
from unittest import SkipTest

import pytest
from rest_framework.test import APITestCase

from core.tests.model_tests import ModelContractMixin
from core.tests.utils import TestLoggerMixin
from order.models import OrderItem, PackType
from order.tests.factories import OrderItemFactory, PackTypeFactory


@pytest.mark.django_db
class TestPackType(APITestCase, ModelContractMixin, TestLoggerMixin):
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
class TestOrderItem(APITestCase, ModelContractMixin, TestLoggerMixin):
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
