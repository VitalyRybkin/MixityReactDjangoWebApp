from catalog.models import (
    DescriptionItem,
    ProductDescription,
    ProductGroup,
    ProductSpecification,
    ProductSpecName,
    ProductUnit,
    PurchasePriceHistory,
    SpecificationGroup,
)
from catalog.tests.api.factories import (
    DescriptionItemFactory,
    ProductDescriptionFactory,
    ProductGroupFactory,
    ProductSpecificationFactory,
    ProductSpecNameFactory,
    ProductUnitFactory,
    PurchasePriceHistoryFactory,
    SpecificationGroupFactory,
)
from core.tests.base_test_case import BaseModelTestCase


class TestDescriptionItemModel(BaseModelTestCase):

    __test__ = True

    _model = DescriptionItem
    _factory = DescriptionItemFactory

    def test_str_with_description(self) -> None:
        expected = self.obj.title
        self._str_method(expected)


class TestPurchasePriceHistoryModel(BaseModelTestCase):

    __test__ = True

    _model = PurchasePriceHistory
    _factory = PurchasePriceHistoryFactory

    def test_str_with_description(self) -> None:
        expected = (
            f"{self.obj.product.name} - {self.obj.warehouse.name} - {self.obj.date}"
        )
        self._str_method(expected)


class TestProductGroupModel(BaseModelTestCase):
    __test__ = True
    _model = ProductGroup
    _factory = ProductGroupFactory

    def test_str_with_description(self) -> None:
        expected = f"{self.obj.name}"
        self._str_method(expected)


class TestSpecificationGroupModel(BaseModelTestCase):
    __test__ = True
    _model = SpecificationGroup
    _factory = SpecificationGroupFactory

    def test_str_with_description(self) -> None:
        expected = f"{self.obj.name}"
        self._str_method(expected)


class TestProductSpecValueModel(BaseModelTestCase):
    __test__ = True
    _model = ProductSpecName
    _factory = ProductSpecNameFactory

    def test_str_method(self) -> None:
        expected = f"{self.obj.title}"
        self._str_method(expected)


class TestProductSpecificationModel(BaseModelTestCase):
    __test__ = True
    _model = ProductSpecification
    _factory = ProductSpecificationFactory

    def test_str_method(self) -> None:
        expected = f"{self.obj.name} ({self.obj.product.name})"
        self._str_method(expected)


class TestProductDescriptionModel(BaseModelTestCase):
    __test__ = True
    _model = ProductDescription
    _factory = ProductDescriptionFactory

    def test_str_method(self) -> None:
        expected = f"{self.obj.product} - {self.obj.item}"
        self._str_method(expected)


class TestProductUnitModel(BaseModelTestCase):
    __test__ = True
    _model = ProductUnit
    _factory = ProductUnitFactory

    def test_str_method(self) -> None:
        expected = f"{self.obj.product} ({self.obj.unit}) - {self.obj.kg_per_unit} kg"
        self._str_method(expected)
