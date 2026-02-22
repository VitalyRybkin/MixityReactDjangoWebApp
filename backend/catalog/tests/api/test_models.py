import pytest

from catalog.models import (
    AppUnit,
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
    UnitFactory,
)
from core.tests.base_test_case import BaseModelTestCase
from core.tests.utils import ValidationFieldSpec


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


@pytest.mark.django_db
class TestProductUnitModel(BaseModelTestCase):
    __test__ = True
    _model = ProductUnit
    _factory = ProductUnitFactory

    invalid_fields_map = [
        ValidationFieldSpec(
            field_name="unit",
            invalid_value=lambda: UnitFactory.create(
                title=AppUnit.TitleChoices.KILOGRAM
            ),
        ),
        ValidationFieldSpec(field_name="kg_per_unit", invalid_value=10),
    ]

    valid_fields_map = [
        ValidationFieldSpec(field_name="kg_per_unit", invalid_value=25),
    ]

    def test_invalid_field_validation(self) -> None:
        self._validate_model_invalid_fields()

    def test_valid_field_validation(self) -> None:
        self._validate_model_valid_fields()

    def test_str_method(self) -> None:
        expected = f"{self.obj.product} ({self.obj.unit}) - {self.obj.kg_per_unit} kg"
        self._str_method(expected)
