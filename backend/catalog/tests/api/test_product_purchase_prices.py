from catalog.api.routes import ProductRoutes
from catalog.tests.api.factories import ProductFactory, PurchasePriceHistoryFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.price_test_base import BasePriceContractMixin, PurchasePricesBaseTest
from stock.tests.factories import WarehouseFactory


class TestPurchasePriceAPIListCreate(PurchasePricesBaseTest, BasePriceContractMixin):
    __test__ = True

    url_name = f"catalog:{ProductRoutes.PURCHASE_PRICES.name}"

    entity_name = "warehouse"

    def test_get_list(self) -> None:
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        str_method_output = (
            f"{self.obj.product.name} - {self.obj.warehouse.name} - {self.obj.date}"
        )
        self._str_method_logic(str_method_output)

    def test_get_purchase_list_contains_product(self) -> None:
        """Test that the list view contains the product."""
        self._get_list_contains_product()

    def test_get_list_filters_by_warehouse(self) -> None:
        """
        Tests the functionality of filtering price histories by warehouse.
        """
        product = ProductFactory.create()
        warehouse = WarehouseFactory.create()

        price = PurchasePriceHistoryFactory.create(
            warehouse=self.obj.warehouse,
            product=product,
        )

        PurchasePriceHistoryFactory.create(
            warehouse=warehouse,
        )

        self._get_prices_filtered_by(price.id)

    def test_duplicate_date_product_warehouse_returns_400(self) -> None:
        """Test that duplicate date, product, and warehouse returns 400."""
        payload = {
            "date": self.obj.date,
            "product": self.obj.product_id,
            "warehouse": self.obj.warehouse_id,
            "purchase_price": "9999.99",
        }

        self._duplicated_date_product_entity_name_returns_400(payload)

    def test_same_date_warehouse_different_product_allowed(self) -> None:
        """Test different product allowed"""
        product = ProductFactory.create()

        payload = {
            "date": self.obj.date,
            "product": product.pk,
            "warehouse": self.obj.warehouse_id,
            "purchase_price": "9999.99",
        }
        self._same_date_entity_name_different_product_allowed(payload, product.pk)

    def payload_generator(self) -> dict:
        product = ProductFactory.create()
        warehouse = WarehouseFactory.create()

        temp = self.factory.build(
            product=product,
            warehouse=warehouse,
        )

        return {
            "date": temp.date,
            "product": product.pk,
            "warehouse": warehouse.pk,
            "purchase_price": str(temp.purchase_price),
        }


class TestPurchasePriceRetrieveUpdate(
    PurchasePricesBaseTest,
    BaseAPIMixin,
):
    __test__ = True

    pk_url_name = f"catalog:{ProductRoutes.PURCHASE_PRICE_DETAIL.name}"

    def test_retrieve_update_logic(self) -> None:
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        self._retrieve_object_by_id_not_found()

    def test_patch_logic(self) -> None:
        payload = {
            "purchase_price": "1000",
        }
        self._patch_logic_success(payload)

    def test_delete_logic(self) -> None:
        self._delete_logic()

    def test_nonexistent_parent_returns_404(self) -> None:
        self._nonexistent_parent_visibility_logic()

    def test_str_method(self) -> None:
        price = self.obj

        expected = (
            f"{price.product.name} - " f"{price.warehouse.name} - " f"{price.date}"
        )

        self._str_method_logic(expected)
