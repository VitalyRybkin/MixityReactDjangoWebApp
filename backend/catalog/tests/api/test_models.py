from decimal import Decimal

import pytest

from catalog.models import (
    DescriptionItem,
    ProductDescription,
    ProductGroup,
    ProductPallet,
    ProductSpecification,
    ProductSpecName,
    ProductUnit,
    PurchasePriceHistory,
    QualityPassport,
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
    QualityPassportFactory,
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
    """Verify description item model contracts."""

    __test__ = True

    _model = DescriptionItem
    _factory = DescriptionItemFactory

    def test_str_with_description(self) -> None:
        """Verify the model string representation includes its identifying fields."""
        self._logger_header("DESCRIPTION ITEM MODEL: STR WITH DESCRIPTION")
        expected = self.obj.title
        self._str_method(expected)
        self._logger_success(
            "str_with_description",
            "Verify the model string representation includes its identifying fields",
        )


class TestPurchasePriceHistoryModel(BaseModelTestCase):
    """Verify purchase price history model contracts."""

    __test__ = True

    _model = PurchasePriceHistory
    _factory = PurchasePriceHistoryFactory

    def test_str_with_description(self) -> None:
        """Verify the model string representation includes its identifying fields."""
        self._logger_header("PURCHASE PRICE HISTORY MODEL: STR WITH DESCRIPTION")
        expected = (
            f"{self.obj.product.name} - {self.obj.warehouse.name} - {self.obj.date}"
        )
        self._str_method(expected)
        self._logger_success(
            "str_with_description",
            "Verify the model string representation includes its identifying fields",
        )

    def test_purchase_price_history(self) -> None:
        """Verify purchase price history."""
        self._logger_header("PURCHASE PRICE HISTORY MODEL: PURCHASE PRICE HISTORY")
        self._test_price_history(
            context_manager_name="latest_prices_for_warehouse_products",
            context_price_model=self._model,
            context_factory=WarehouseFactory,
            price_factory=self._factory,
            context_field="warehouse_id",
            owner_field="warehouse",
        )
        self._logger_success("purchase_price_history", "Verify purchase price history")


class TestSalesPriceHistoryModel(BaseModelTestCase):
    """Verify sales price history model contracts."""

    __test__ = True
    _model = SalesPriceHistory
    _factory = SalePriceHistoryFactory

    def test_str_with_description(self) -> None:
        """Verify the model string representation includes its identifying fields."""
        self._logger_header("SALES PRICE HISTORY MODEL: STR WITH DESCRIPTION")
        expected = (
            f"{self.obj.product.name} - {self.obj.customer.name} - {self.obj.date}"
        )
        self._str_method(expected)
        self._logger_success(
            "str_with_description",
            "Verify the model string representation includes its identifying fields",
        )

    def test_sales_price_history(self) -> None:
        """Verify sales price history."""
        self._logger_header("SALES PRICE HISTORY MODEL: SALES PRICE HISTORY")
        self._test_price_history(
            context_manager_name="latest_prices_for_customer_products",
            context_price_model=self._model,
            context_factory=CustomerFactory,
            price_factory=self._factory,
            context_field="customer_id",
            owner_field="customer",
        )
        self._logger_success("sales_price_history", "Verify sales price history")


class TestProductGroupModel(BaseModelTestCase):
    """Verify product group model contracts."""

    __test__ = True
    _model = ProductGroup
    _factory = ProductGroupFactory

    def test_str_with_description(self) -> None:
        """Verify the model string representation includes its identifying fields."""
        self._logger_header("PRODUCT GROUP MODEL: STR WITH DESCRIPTION")
        expected = f"{self.obj.name}"
        self._str_method(expected)
        self._logger_success(
            "str_with_description",
            "Verify the model string representation includes its identifying fields",
        )


class TestSpecificationGroupModel(BaseModelTestCase):
    """Verify specification group model contracts."""

    __test__ = True
    _model = SpecificationGroup
    _factory = SpecificationGroupFactory

    def test_str_with_description(self) -> None:
        """Verify the model string representation includes its identifying fields."""
        self._logger_header("SPECIFICATION GROUP MODEL: STR WITH DESCRIPTION")
        expected = f"{self.obj.name}"
        self._str_method(expected)
        self._logger_success(
            "str_with_description",
            "Verify the model string representation includes its identifying fields",
        )


class TestProductSpecValueModel(BaseModelTestCase):
    """Verify product spec value model contracts."""

    __test__ = True
    _model = ProductSpecName
    _factory = ProductSpecNameFactory

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("PRODUCT SPEC VALUE MODEL: STR METHOD")
        expected = f"{self.obj.title}"
        self._str_method(expected)
        self._logger_success("str_method", "Verify the model string representation")


class TestProductSpecificationModel(BaseModelTestCase):
    """Verify product specification model contracts."""

    __test__ = True
    _model = ProductSpecification
    _factory = ProductSpecificationFactory

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("PRODUCT SPECIFICATION MODEL: STR METHOD")
        expected = f"{self.obj.name} ({self.obj.product.name})"
        self._str_method(expected)
        self._logger_success("str_method", "Verify the model string representation")


class TestProductDescriptionModel(BaseModelTestCase):
    """Verify product description model contracts."""

    __test__ = True
    _model = ProductDescription
    _factory = ProductDescriptionFactory

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("PRODUCT DESCRIPTION MODEL: STR METHOD")
        expected = f"{self.obj.product} - {self.obj.item}"
        self._str_method(expected)
        self._logger_success("str_method", "Verify the model string representation")


@pytest.mark.django_db
class TestProductUnitModel(BaseModelTestCase):
    """Verify product unit model contracts."""

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
        """Reject invalid model field values."""
        self._logger_header("PRODUCT UNIT MODEL: INVALID FIELD VALIDATION")
        self._validate_model_invalid_fields()
        self._logger_success(
            "invalid_field_validation", "Reject invalid model field values"
        )

    def test_valid_field_validation(self) -> None:
        """Accept valid model field values."""
        self._logger_header("PRODUCT UNIT MODEL: VALID FIELD VALIDATION")
        self._validate_model_valid_fields()
        self._logger_success(
            "valid_field_validation", "Accept valid model field values"
        )

    def test_ton_product_unit_value_is_forced_to_one(self) -> None:
        """Verify ton product unit value is forced to one."""
        self._logger_header(
            "PRODUCT UNIT MODEL: TON PRODUCT UNIT VALUE IS FORCED TO ONE"
        )
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
        self._logger_success(
            "ton_product_unit_value_is_forced_to_one",
            "Verify ton product unit value is forced to one",
        )

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("PRODUCT UNIT MODEL: STR METHOD")
        expected = f"{self.obj.product} ({self.obj.unit.title}) - {self.obj.value}"
        self._str_method(expected)
        self._logger_success("str_method", "Verify the model string representation")


class TestProductPaletteModel(BaseModelTestCase):
    """Verify product palette model contracts."""

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
        """Reject invalid model field values."""
        self._logger_header("PRODUCT PALETTE MODEL: INVALID FIELD VALIDATION")
        self._validate_model_invalid_fields()
        self._logger_success(
            "invalid_field_validation", "Reject invalid model field values"
        )

    def test_valid_field_validation(self) -> None:
        """Accept valid model field values."""
        self._logger_header("PRODUCT PALETTE MODEL: VALID FIELD VALIDATION")
        self._validate_model_valid_fields()
        self._logger_success(
            "valid_field_validation", "Accept valid model field values"
        )

    def test_str_with_description(self) -> None:
        """Verify the model string representation includes its identifying fields."""
        self._logger_header("PRODUCT PALETTE MODEL: STR WITH DESCRIPTION")
        expected = f"{self.obj.product.name} @ {self.obj.warehouse.name}: {self.obj.items_per_pallet} шт"
        self._str_method(expected)
        self._logger_success(
            "str_with_description",
            "Verify the model string representation includes its identifying fields",
        )


class TestQualityPassportModel(BaseModelTestCase):
    """Verify quality passport model contracts."""

    __test__ = True
    _model = QualityPassport
    _factory = QualityPassportFactory

    invalid_fields_map = [
        ValidationFieldSpec(field_name="number", invalid_value=0),
        ValidationFieldSpec(field_name="number", invalid_value=-1),
        ValidationFieldSpec(field_name="number", invalid_value=2_147_483_648),
        ValidationFieldSpec(field_name="number", invalid_value=Decimal("5.5")),
        ValidationFieldSpec(field_name="batch_number", invalid_value=Decimal("-0.001")),
        ValidationFieldSpec(
            field_name="batch_number", invalid_value=Decimal("28.3456")
        ),
        ValidationFieldSpec(
            field_name="batch_number", invalid_value=Decimal("1000000")
        ),
        ValidationFieldSpec(field_name="batch_number", invalid_value=999999.9991),
        ValidationFieldSpec(field_name="quantity", invalid_value=123456789101),
        ValidationFieldSpec(
            field_name="quantity", invalid_value=Decimal("1234568.1234")
        ),
        ValidationFieldSpec(field_name="quantity", invalid_value=-1),
    ]

    valid_fields_map = [
        ValidationFieldSpec(field_name="number", invalid_value=54672),
        ValidationFieldSpec(field_name="batch_number", invalid_value=Decimal("0")),
        ValidationFieldSpec(
            field_name="batch_number", invalid_value=Decimal("999999.999")
        ),
        ValidationFieldSpec(
            field_name="quantity",
            invalid_value=Decimal("30.000"),
        ),
    ]

    def test_invalid_field_validation(self) -> None:
        """Reject invalid model field values."""
        self._logger_header("QUALITY PASSPORT MODEL: INVALID FIELD VALIDATION")
        self._validate_model_invalid_fields()
        self._logger_success(
            "invalid_field_validation", "Reject invalid model field values"
        )

    def test_valid_field_validation(self) -> None:
        """Accept valid model field values."""
        self._logger_header("QUALITY PASSPORT MODEL: VALID FIELD VALIDATION")
        self._validate_model_valid_fields()
        self._logger_success(
            "valid_field_validation", "Accept valid model field values"
        )

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("QUALITY PASSPORT MODEL: STR METHOD")
        expected = f"Паспорт № {self.obj.number} — {self.obj.product.name}"
        self._str_method(expected)
        self._logger_success("str_method", "Verify the model string representation")
