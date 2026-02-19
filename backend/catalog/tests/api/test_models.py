from unittest import TestCase

from catalog.tests.api.factories import (
    DescriptionItemFactory,
    ProductGroupFactory,
    PurchasePriceHistoryFactory,
)
from core.tests.utils import TestLoggingMixin


class TestDescriptionItemModel(TestCase, TestLoggingMixin):
    def test_str(self) -> None:
        obj = DescriptionItemFactory.build()
        self._logger_header(f"METHOD: __str__ for {DescriptionItemFactory.__name__}")
        self.assertEqual(str(obj), obj.title)
        print(f"    {self.COLOR['OK']}✓ String matches: {obj.title}{self.COLOR['END']}")


class TestPurchasePriceHistoryModel(TestCase, TestLoggingMixin):
    def test_str(self) -> None:
        obj = PurchasePriceHistoryFactory.build()
        self._logger_header(
            f"METHOD: __str__ for {PurchasePriceHistoryFactory.__name__}"
        )
        expected = f"{obj.product.name} - {obj.warehouse.name} - {obj.date}"
        self.assertEqual(str(obj), expected)
        print(f"    {self.COLOR['OK']}✓ String matches: {expected}{self.COLOR['END']}")


class TestProductGroupModel(TestCase, TestLoggingMixin):
    def test_str(self) -> None:
        obj = ProductGroupFactory.build()
        self._logger_header(f"METHOD: __str__ for {ProductGroupFactory.__name__}")
        expected = f"{obj.name}"
        self.assertEqual(str(obj), expected)
        print(f"    {self.COLOR['OK']}✓ String matches: {expected}{self.COLOR['END']}")
