from catalog.models import (
    DescriptionItem,
    ProductDescription,
    ProductGroup,
    ProductSpecification,
    ProductSpecName,
    PurchasePriceHistory,
    SpecificationGroup,
)
from catalog.tests.api.factories import (
    DescriptionItemFactory,
    ProductDescriptionFactory,
    ProductGroupFactory,
    ProductSpecificationFactory,
    ProductSpecNameFactory,
    PurchasePriceHistoryFactory,
    SpecificationGroupFactory,
)
from core.tests.base_test_case import BaseModelTestCase


class TestDescriptionItemModel(BaseModelTestCase):

    __test__ = True

    test_model = DescriptionItem
    test_factory = DescriptionItemFactory

    def test_str_with_description(self) -> None:
        expected = self.obj.title
        self._str_method(expected)


class TestPurchasePriceHistoryModel(BaseModelTestCase):

    __test__ = True

    test_model = PurchasePriceHistory
    test_factory = PurchasePriceHistoryFactory

    def test_str_with_description(self) -> None:
        expected = (
            f"{self.obj.product.name} - {self.obj.warehouse.name} - {self.obj.date}"
        )
        self._str_method(expected)


class TestProductGroupModel(BaseModelTestCase):
    __test__ = True
    test_model = ProductGroup
    test_factory = ProductGroupFactory

    def test_str_with_description(self) -> None:
        expected = f"{self.obj.name}"
        self._str_method(expected)


class TestSpecificationGroupModel(BaseModelTestCase):
    __test__ = True
    test_model = SpecificationGroup
    test_factory = SpecificationGroupFactory

    def test_str_with_description(self) -> None:
        expected = f"{self.obj.name}"
        self._str_method(expected)


class TestProductSpecValueModel(BaseModelTestCase):
    __test__ = True
    test_model = ProductSpecName
    test_factory = ProductSpecNameFactory

    def test_str_method(self) -> None:
        expected = f"{self.obj.title}"
        self._str_method(expected)


class TestProductSpecificationModel(BaseModelTestCase):
    __test__ = True
    test_model = ProductSpecification
    test_factory = ProductSpecificationFactory

    def test_str_method(self) -> None:
        expected = f"{self.obj.name} ({self.obj.product.name})"
        self._str_method(expected)


class TestProductDescriptionModel(BaseModelTestCase):
    __test__ = True
    test_model = ProductDescription
    test_factory = ProductDescriptionFactory

    def test_str_method(self) -> None:
        expected = f"{self.obj.product} - {self.obj.item}"
        self._str_method(expected)
