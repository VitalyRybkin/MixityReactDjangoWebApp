import pytest
from django.core.exceptions import ValidationError

from catalog.models import (
    DescriptionItem,
    ProductDescription,
    ProductGroup,
    ProductPallet,
    ProductSpecification,
    ProductSpecName,
    ProductUnit,
    PurchasePriceHistory,
    SalesPriceHistory,
    SpecificationGroup,
)
from catalog.tests.api.factories import (
    DescriptionItemFactory,
    ProductDescriptionFactory,
    ProductFactory,
    ProductGroupFactory,
    ProductPaletteFactory,
    ProductSpecificationFactory,
    ProductSpecNameFactory,
    ProductUnitFactory,
    PurchasePriceHistoryFactory,
    SalePriceHistoryFactory,
    SpecificationGroupFactory,
    UnitFactory,
)
from catalog.utils.unit_choices import TitleChoices
from core.tests.base_model_test_case import BaseModelTestCase
from core.tests.utils import ValidationFieldSpec
from order.tests.factories import CustomerFactory
from stock.tests.factories import WarehouseFactory


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

    def test_purchase_price_history(self) -> None:
        self._test_price_history(
            context_manager_name="latest_prices_for_warehouse_products",
            context_price_model=self._model,
            context_factory=WarehouseFactory,
            price_factory=self._factory,
            context_field="warehouse_id",
            owner_field="warehouse",
        )


class TestSalesPriceHistoryModel(BaseModelTestCase):
    __test__ = True
    _model = SalesPriceHistory
    _factory = SalePriceHistoryFactory

    def test_str_with_description(self) -> None:
        expected = (
            f"{self.obj.product.name} - {self.obj.customer.name} - {self.obj.date}"
        )
        self._str_method(expected)

    def test_sales_price_history(self) -> None:
        self._test_price_history(
            context_manager_name="latest_prices_for_customer_products",
            context_price_model=self._model,
            context_factory=CustomerFactory,
            price_factory=self._factory,
            context_field="customer_id",
            owner_field="customer",
        )


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
            invalid_value=lambda: UnitFactory.create(title=TitleChoices.KILOGRAM),
        ),
        ValidationFieldSpec(field_name="value", invalid_value=11),
        ValidationFieldSpec(field_name="value", invalid_value=13),
        ValidationFieldSpec(field_name="value", invalid_value=14),
        ValidationFieldSpec(field_name="value", invalid_value=16),
        ValidationFieldSpec(field_name="value", invalid_value=24),
        ValidationFieldSpec(field_name="value", invalid_value=31),
    ]

    valid_fields_map = [
        ValidationFieldSpec(field_name="value", invalid_value=10),
        ValidationFieldSpec(field_name="value", invalid_value=12),
        ValidationFieldSpec(field_name="value", invalid_value=15),
        ValidationFieldSpec(field_name="value", invalid_value=20),
        ValidationFieldSpec(field_name="value", invalid_value=25),
        ValidationFieldSpec(field_name="value", invalid_value=30),
    ]

    def test_invalid_field_validation(self) -> None:
        self._validate_model_invalid_fields()

    def test_valid_field_validation(self) -> None:
        self._validate_model_valid_fields()

    def test_ton_product_unit_value_is_forced_to_one(self) -> None:
        product = ProductFactory.create()
        unit = UnitFactory.create(title=TitleChoices.TON)

        product_unit = ProductUnitFactory.create(
            product=product,
            unit=unit,
            value=10,
        )

        self._test_autosaved_value(
            obj=product_unit,
            field_name="value",
            autosaved_value=1,
        )

    def test_str_method(self) -> None:
        expected = f"{self.obj.product} ({self.obj.unit.title}) - {self.obj.value}"
        self._str_method(expected)


class TestProductPaletteModel(BaseModelTestCase):
    __test__ = True
    _model = ProductPallet
    _factory = ProductPaletteFactory

    invalid_fields_map = [
        ValidationFieldSpec(field_name="items_per_pallet", invalid_value=10),
    ]

    valid_fields_map = [
        ValidationFieldSpec(field_name="items_per_pallet", invalid_value=40),
        ValidationFieldSpec(field_name="items_per_pallet", invalid_value=48),
    ]

    def test_invalid_field_validation(self) -> None:
        self._validate_model_invalid_fields()

    def test_valid_field_validation(self) -> None:
        self._validate_model_valid_fields()

    def test_str_with_description(self) -> None:
        expected = f"{self.obj.product.name} @ {self.obj.warehouse.name}: {self.obj.items_per_pallet} шт"
        self._str_method(expected)
