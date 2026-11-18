from catalog.api.routes import ProductRoutes
from catalog.tests.api.factories import ProductFactory, SalePriceHistoryFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.price_test_base import BasePriceContractMixin, SalePricesBaseTest
from order.tests.factories import CustomerFactory


class TestSalePriceAPIListCreate(
    SalePricesBaseTest,
    BasePriceContractMixin,
):
    """
    Tests the list and create operations for sale price records within the
    catalog API test suite. Combines sale price test fixtures with shared API
    assertions to ensure that sale price records are handled consistently for
    retrieval, creation, and string representation checks.
    """

    __test__ = True

    pk_url_name = f"catalog:{ProductRoutes.PRODUCT_SALES_PRICES.name}"

    entity_name = "customer"

    def test_get_list(self) -> None:
        """Verify the list response matches the expected resource fields."""
        self._logger_header("SALE PRICE APILIST CREATE: GET LIST")
        self._get_list_logic()
        self._logger_success(
            "get_list", "Verify the list response matches the expected resource fields"
        )

    def test_creating_item_logic(self) -> None:
        """Verify valid input creates a resource."""
        self._logger_header("SALE PRICE APILIST CREATE: CREATING ITEM LOGIC")
        payload = self.payload_generator()
        self._create_logic(payload)
        self._logger_success(
            "creating_item_logic", "Verify valid input creates a resource"
        )

    def test_item_unique_fields(self) -> None:
        """Reject duplicate values for unique fields."""
        self._logger_header("SALE PRICE APILIST CREATE: ITEM UNIQUE FIELDS")
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)
        self._logger_success(
            "item_unique_fields", "Reject duplicate values for unique fields"
        )

    def test_item_mandatory_fields(self) -> None:
        """Reject requests that omit required fields."""
        self._logger_header("SALE PRICE APILIST CREATE: ITEM MANDATORY FIELDS")
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)
        self._logger_success(
            "item_mandatory_fields", "Reject requests that omit required fields"
        )

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("SALE PRICE APILIST CREATE: STR METHOD")
        str_method_output = (
            f"{self.obj.product.name} - {self.obj.customer.name} - {self.obj.date}"
        )
        self._str_method_logic(str_method_output)
        self._logger_success("str_method", "Verify the model string representation")

    def test_get_list_filters_by_customer(self) -> None:
        """
        Tests retrieval and filtering of price lists for a specific customer.
        """
        self._logger_header("SALE PRICE APILIST CREATE: GET LIST FILTERS BY CUSTOMER")
        customer = CustomerFactory.create()

        SalePriceHistoryFactory.create(
            product=self.obj.product,
            customer=customer,
        )

        self._get_prices_filtered_by(self.obj.id)
        self._logger_success(
            "get_list_filters_by_customer", "Verify get list filters by customer"
        )

    def test_duplicate_date_product_customer_returns_400(self) -> None:
        """Test that duplicate date, product, and customer returns 400."""
        self._logger_header(
            "SALE PRICE APILIST CREATE: DUPLICATE DATE PRODUCT CUSTOMER RETURNS 400"
        )
        payload = {
            "date": self.obj.date,
            "customer": self.obj.customer_id,
            "sale_price": "9999.99",
        }

        self._duplicated_date_product_entity_name_returns_400(payload)
        self._logger_success(
            "duplicate_date_product_customer_returns_400",
            "Verify duplicate date product customer returns 400",
        )

    def test_same_date_customer_different_product_allowed(self) -> None:
        """Test same date/customer is allowed for another product."""
        self._logger_header(
            "SALE PRICE APILIST CREATE: SAME DATE CUSTOMER DIFFERENT PRODUCT ALLOWED"
        )
        product = ProductFactory.create()

        payload = {
            "date": self.obj.date,
            "customer": self.obj.customer_id,
            "sale_price": "9999.99",
        }

        self._same_date_entity_name_different_product_allowed(
            payload,
            product.pk,
        )
        self._logger_success(
            "same_date_customer_different_product_allowed",
            "Verify same date customer different product allowed",
        )

    def payload_generator(self) -> dict:
        """Build valid request data from the resource fixture."""
        customer = CustomerFactory.create()

        temp = self.factory.build(
            product=self.obj.product,
            customer=customer,
        )

        return {
            "date": temp.date,
            "customer": customer.pk,
            "sale_price": str(temp.sale_price),
        }


class TestSalePriceRetrieveUpdate(SalePricesBaseTest, BaseAPIMixin):
    """
    Tests the retrieve and update operations for sale price records within the
    catalog API test suite. Combines sale price test fixtures with shared API
    assertions to ensure that sale price records are handled consistently for
    retrieval, update, and string representation checks.
    """

    __test__ = True

    pk_url_name = f"catalog:{ProductRoutes.SALES_PRICE_DETAIL.name}"

    def test_retrieve_update_logic(self) -> None:
        """Verify retrieval returns the requested resource."""
        self._logger_header("SALE PRICE RETRIEVE UPDATE: RETRIEVE UPDATE LOGIC")
        self._retrieve_object_by_id()
        self._logger_success(
            "retrieve_update_logic", "Verify retrieval returns the requested resource"
        )

    def test_not_found_error(self) -> None:
        """Return HTTP 404 for a nonexistent resource."""
        self._logger_header("SALE PRICE RETRIEVE UPDATE: NOT FOUND ERROR")
        self._retrieve_object_by_id_not_found()
        self._logger_success(
            "not_found_error", "Return HTTP 404 for a nonexistent resource"
        )

    def test_patch_logic(self) -> None:
        """Verify a partial update succeeds."""
        self._logger_header("SALE PRICE RETRIEVE UPDATE: PATCH LOGIC")
        payload = {"sale_price": "1000"}
        self._patch_logic_success(payload)
        self._logger_success("patch_logic", "Verify a partial update succeeds")

    def test_delete_logic(self) -> None:
        """Verify resource deletion succeeds."""
        self._logger_header("SALE PRICE RETRIEVE UPDATE: DELETE LOGIC")
        self._delete_logic()
        self._logger_success("delete_logic", "Verify resource deletion succeeds")

    def test_nonexistent_parent_returns_404(self) -> None:
        """Verify nonexistent parent returns 404."""
        self._logger_header(
            "SALE PRICE RETRIEVE UPDATE: NONEXISTENT PARENT RETURNS 404"
        )
        self._nonexistent_parent_visibility_logic()
        self._logger_success(
            "nonexistent_parent_returns_404", "Verify nonexistent parent returns 404"
        )

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("SALE PRICE RETRIEVE UPDATE: STR METHOD")
        price = self.obj
        expected = f"{price.product.name} - {price.customer.name} - {price.date}"
        self._str_method_logic(expected)
        self._logger_success("str_method", "Verify the model string representation")
