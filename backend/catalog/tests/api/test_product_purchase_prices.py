from catalog.api.routes import ProductRoutes
from catalog.tests.api.factories import ProductFactory, PurchasePriceHistoryFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.price_test_base import BasePriceContractMixin, PurchasePricesBaseTest
from stock.tests.factories import WarehouseFactory


class TestPurchasePriceAPIListCreate(
    PurchasePricesBaseTest,
    BasePriceContractMixin,
):
    """
    Validate purchase price list and creation API behavior for warehouse-specific
    price history records.

    Verifies the API behavior for listing, creating, validating, and
    filtering purchase price records associated with products and warehouses. Covers uniqueness,
    mandatory field validation, duplicate record rejection,
    cross-product allowance for shared dates and warehouses, and string
    representation expectations.
    """

    __test__ = True

    pk_url_name = f"catalog:{ProductRoutes.PRODUCT_PURCHASE_PRICES.name}"

    entity_name = "warehouse"

    def test_get_list(self) -> None:
        """Verify the list response matches the expected resource fields."""
        self._logger_header("PURCHASE PRICE APILIST CREATE: GET LIST")
        self._get_list_logic()
        self._logger_success(
            "get_list", "Verify the list response matches the expected resource fields"
        )

    def test_creating_item_logic(self) -> None:
        """Verify valid input creates a resource."""
        self._logger_header("PURCHASE PRICE APILIST CREATE: CREATING ITEM LOGIC")
        payload = self.payload_generator()
        self._create_logic(payload)
        self._logger_success(
            "creating_item_logic", "Verify valid input creates a resource"
        )

    def test_item_unique_fields(self) -> None:
        """Reject duplicate values for unique fields."""
        self._logger_header("PURCHASE PRICE APILIST CREATE: ITEM UNIQUE FIELDS")
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)
        self._logger_success(
            "item_unique_fields", "Reject duplicate values for unique fields"
        )

    def test_item_mandatory_fields(self) -> None:
        """Reject requests that omit required fields."""
        self._logger_header("PURCHASE PRICE APILIST CREATE: ITEM MANDATORY FIELDS")
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)
        self._logger_success(
            "item_mandatory_fields", "Reject requests that omit required fields"
        )

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("PURCHASE PRICE APILIST CREATE: STR METHOD")
        str_method_output = (
            f"{self.obj.product.name} - {self.obj.warehouse.name} - {self.obj.date}"
        )
        self._str_method_logic(str_method_output)
        self._logger_success("str_method", "Verify the model string representation")

    def test_get_list_filters_by_warehouse(self) -> None:
        """
        Filters and retrieves prices based on a specific warehouse and product combination.
        """
        self._logger_header(
            "PURCHASE PRICE APILIST CREATE: GET LIST FILTERS BY WAREHOUSE"
        )
        warehouse = WarehouseFactory.create()

        PurchasePriceHistoryFactory.create(
            product=self.obj.product,
            warehouse=warehouse,
        )

        self._get_prices_filtered_by(self.obj.id)
        self._logger_success(
            "get_list_filters_by_warehouse", "Verify get list filters by warehouse"
        )

    def test_duplicate_date_product_warehouse_returns_400(self) -> None:
        """Test that duplicate date, product, and warehouse returns 400."""
        self._logger_header(
            "PURCHASE PRICE APILIST CREATE: DUPLICATE DATE PRODUCT WAREHOUSE RETURNS 400"
        )
        payload = {
            "date": self.obj.date,
            "warehouse": self.obj.warehouse_id,
            "purchase_price": "9999.99",
        }

        self._duplicated_date_product_entity_name_returns_400(payload)
        self._logger_success(
            "duplicate_date_product_warehouse_returns_400",
            "Verify duplicate date product warehouse returns 400",
        )

    def test_same_date_warehouse_different_product_allowed(self) -> None:
        """Test same date/warehouse is allowed for another product."""
        self._logger_header(
            "PURCHASE PRICE APILIST CREATE: SAME DATE WAREHOUSE DIFFERENT PRODUCT ALLOWED"
        )
        product = ProductFactory.create()

        payload = {
            "date": self.obj.date,
            "warehouse": self.obj.warehouse_id,
            "purchase_price": "9999.99",
        }

        self._same_date_entity_name_different_product_allowed(
            payload,
            product.pk,
        )
        self._logger_success(
            "same_date_warehouse_different_product_allowed",
            "Verify same date warehouse different product allowed",
        )

    def payload_generator(self) -> dict:
        """Build valid request data from the resource fixture."""
        warehouse = WarehouseFactory.create()

        temp = self.factory.build(
            product=self.obj.product,
            warehouse=warehouse,
        )

        return {
            "date": temp.date,
            "warehouse": warehouse.pk,
            "purchase_price": str(temp.purchase_price),
        }


class TestPurchasePriceRetrieveUpdate(
    PurchasePricesBaseTest,
    BaseAPIMixin,
):
    """
    Test case for purchase price detail endpoint behavior.

    Validates the expected behavior of purchase price detail operations within the
    catalog API test suite. Combines purchase price test fixtures with
    shared API assertions to ensure that purchase price records are handled
    consistently for retrieval, update, deletion, missing-resource handling,
    parent visibility constraints, and string representation checks.
    """

    __test__ = True

    pk_url_name = f"catalog:{ProductRoutes.PURCHASE_PRICE_DETAIL.name}"

    def test_retrieve_update_logic(self) -> None:
        """Verify retrieval returns the requested resource."""
        self._logger_header("PURCHASE PRICE RETRIEVE UPDATE: RETRIEVE UPDATE LOGIC")
        self._retrieve_object_by_id()
        self._logger_success(
            "retrieve_update_logic", "Verify retrieval returns the requested resource"
        )

    def test_not_found_error(self) -> None:
        """Return HTTP 404 for a nonexistent resource."""
        self._logger_header("PURCHASE PRICE RETRIEVE UPDATE: NOT FOUND ERROR")
        self._retrieve_object_by_id_not_found()
        self._logger_success(
            "not_found_error", "Return HTTP 404 for a nonexistent resource"
        )

    def test_patch_logic(self) -> None:
        """Verify a partial update succeeds."""
        self._logger_header("PURCHASE PRICE RETRIEVE UPDATE: PATCH LOGIC")
        payload = {
            "purchase_price": "1000",
        }
        self._patch_logic_success(payload)
        self._logger_success("patch_logic", "Verify a partial update succeeds")

    def test_delete_logic(self) -> None:
        """Verify resource deletion succeeds."""
        self._logger_header("PURCHASE PRICE RETRIEVE UPDATE: DELETE LOGIC")
        self._delete_logic()
        self._logger_success("delete_logic", "Verify resource deletion succeeds")

    def test_nonexistent_parent_returns_404(self) -> None:
        """Verify nonexistent parent returns 404."""
        self._logger_header(
            "PURCHASE PRICE RETRIEVE UPDATE: NONEXISTENT PARENT RETURNS 404"
        )
        self._nonexistent_parent_visibility_logic()
        self._logger_success(
            "nonexistent_parent_returns_404", "Verify nonexistent parent returns 404"
        )

    def test_str_method(self) -> None:
        """Verify the model string representation."""
        self._logger_header("PURCHASE PRICE RETRIEVE UPDATE: STR METHOD")
        price = self.obj

        expected = (
            f"{price.product.name} - " f"{price.warehouse.name} - " f"{price.date}"
        )

        self._str_method_logic(expected)
        self._logger_success("str_method", "Verify the model string representation")
