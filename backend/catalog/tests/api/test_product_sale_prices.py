from catalog.api.routes import ProductRoutes
from catalog.tests.api.factories import ProductFactory, SalePriceHistoryFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.price_test_base import BasePriceContractMixin, SalePricesBaseTest
from order.tests.factories import CustomerFactory


class TestSalePriceAPIListCreate(SalePricesBaseTest, BasePriceContractMixin):
    __test__ = True

    url_name = f"catalog:{ProductRoutes.SALES_PRICES.name}"

    entity_name = "customer"

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
            f"{self.obj.product.name} - {self.obj.customer.name} - {self.obj.date}"
        )
        self._str_method_logic(str_method_output)

    def test_get_sale_list_contains_product(self) -> None:
        """Test that the list view contains the product."""
        self._get_list_contains_product()

    def test_get_list_filters_by_customer(self) -> None:
        """FILTER: Sales prices by customer"""
        product = ProductFactory.create()
        customer = CustomerFactory.create()

        price = SalePriceHistoryFactory.create(
            customer=self.obj.customer,
            product=product,
        )

        SalePriceHistoryFactory.create(
            customer=customer,
        )

        self._get_prices_filtered_by(price.id)

    def test_duplicate_date_product_customer_returns_400(self) -> None:
        """Test that duplicate date, product, and customer returns 400."""
        payload = {
            "date": self.obj.date,
            "product": self.obj.product_id,
            "customer": self.obj.customer_id,
            "sale_price": "9999.99",
        }

        self._duplicated_date_product_entity_name_returns_400(payload)

    def test_same_date_customer_different_product_allowed(self) -> None:
        """Test different product allowed"""
        product = ProductFactory.create()

        payload = {
            "date": self.obj.date,
            "product": product.pk,
            "customer": self.obj.customer_id,
            "sale_price": "9999.99",
        }
        self._same_date_entity_name_different_product_allowed(payload, product.pk)

    def payload_generator(self) -> dict:
        product = ProductFactory.create()
        customer = CustomerFactory.create()

        temp = self.factory.build(
            product=product,
            customer=customer,
        )

        return {
            "date": temp.date,
            "product": product.pk,
            "customer": customer.pk,
            "sale_price": str(temp.sale_price),
        }


class TestSalePriceRetrieveUpdate(SalePricesBaseTest, BaseAPIMixin):
    __test__ = True

    pk_url_name = f"catalog:{ProductRoutes.SALES_PRICE_DETAIL.name}"

    def test_retrieve_update_logic(self) -> None:
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        self._retrieve_object_by_id_not_found()

    def test_patch_logic(self) -> None:
        payload = {"sale_price": "1000"}
        self._patch_logic_success(payload)

    def test_delete_logic(self) -> None:
        self._delete_logic()

    def test_nonexistent_parent_returns_404(self) -> None:
        self._nonexistent_parent_visibility_logic()

    def test_str_method(self) -> None:
        price = self.obj
        expected = f"{price.product.name} - {price.customer.name} - {price.date}"
        self._str_method_logic(expected)
