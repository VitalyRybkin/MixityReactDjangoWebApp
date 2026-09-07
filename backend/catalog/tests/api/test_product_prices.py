import logging

from catalog.api.routes import ProductRoutes
from catalog.api.serializers.product_serializers import SalesPriceHistoryReadSerializer
from catalog.models import SalesPriceHistory
from catalog.tests.api.factories import SalePriceHistoryFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from order.tests.factories import CustomerFactory

logger = logging.getLogger(__name__)


class SalePricesBaseTest:
    model = SalesPriceHistory
    factory = SalePriceHistoryFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "date": FieldSpec("date", str, required=True),
        "sale_price": FieldSpec("sale_price", float, required=True),
    }

    def get_serializer(self) -> SalesPriceHistoryReadSerializer:
        return SalesPriceHistoryReadSerializer()


class TestSalePriceAPIListCreate(SalePricesBaseTest, BaseAPIMixin):
    __test__ = True

    pk_url_name = f"catalog:{ProductRoutes.LIST_CREATE_SALES_PRICES.name}"

    def get_query_params(self) -> dict:
        return {
            "customer": self.obj.customer_id,
        }

    def get_permission_test_params(self) -> dict:
        return self.get_query_params()

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

    def payload_generator(self) -> dict:
        customer = CustomerFactory.create()
        temp = self.factory.build(customer=customer)

        return {
            "date": temp.date,
            "customer": temp.customer_id,
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
