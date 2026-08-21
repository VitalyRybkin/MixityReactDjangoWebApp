import datetime
from typing import Any, ClassVar, Protocol, cast

from catalog.api.routes import ProductRoutes
from catalog.models import Product
from catalog.tests.api.factories import ProductFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec


class TestProductAPIList(BaseAPIMixin):
    __test__ = True
    url_name = f"catalog:{ProductRoutes.LIST_CREATE.name}"
    model = Product
    factory = ProductFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str, required=True),
        "title": FieldSpec("title", str, required=True),
        # "product_group": FieldSpec("product_group", str, required=True),
        # "product_image": FieldSpec("product_image", str),
        "forWeb": FieldSpec("for_web", bool),
        "isPieceBased": FieldSpec("is_piece_based", bool),
    }

    def test_get_list(self) -> None:
        """Test that we can get a list of products."""
        return self._get_list_logic()


class PriceHistoryTestHost(Protocol):
    factory: Any

    def _get_latest_price(
        self,
        context_id: Any,
        product_id: Any,
        expected_price: Any,
    ) -> None: ...

    def _get_latest_price_invalid_product_id(
        self,
        context_id: Any,
        product_id: Any,
    ) -> None: ...


class BaseTestPriceHistory:
    price_context_factory: ClassVar[Any | None] = None
    context_field: ClassVar[str | None] = None

    def test_latest_sales_price(self) -> None:
        if self.price_context_factory is None:
            raise AssertionError("price_context_factory is not configured")

        if self.context_field is None:
            raise AssertionError("context_field is not configured")

        host = cast(PriceHistoryTestHost, self)

        context_obj = self.price_context_factory.create()
        product = ProductFactory.create()

        latest_price_date = datetime.date.today()
        price_a_day_before = latest_price_date - datetime.timedelta(days=1)

        host.factory.create(
            **{
                self.context_field: context_obj,
                "product": product,
                "date": price_a_day_before,
            }
        )

        latest_price_to_retrieve = host.factory.create(
            **{
                self.context_field: context_obj,
                "product": product,
                "date": latest_price_date,
            }
        )

        host._get_latest_price(
            context_obj.id,
            product.id,
            latest_price_to_retrieve,
        )

    def test_latest_sales_price_invalid_ids(self) -> None:
        """
        Test retrieval of the latest sales price with invalid productIDs.
        """
        host = cast(PriceHistoryTestHost, self)

        customer_id = 2
        invalid_product_id = "not-an-integer"

        host._get_latest_price_invalid_product_id(
            customer_id,
            invalid_product_id,
        )
