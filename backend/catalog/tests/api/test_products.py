import datetime
from typing import Any, ClassVar, Protocol, cast

from catalog.api.routes import ProductRoutes
from catalog.models import Product
from catalog.tests.api.factories import ProductFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec


class TestProductAPIList(BaseAPIMixin):
    """
    Tests the list operations for product records within the catalog API test suite.
    Combines product test fixtures with shared API assertions to ensure that product
    records are handled consistently for retrieval and string representation checks.
    """

    __test__ = True
    url_name = f"catalog:{ProductRoutes.LIST.name}"
    model = Product
    factory = ProductFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str, required=True),
        "title": FieldSpec("title", str, required=True),
        # "product_group": FieldSpec("product_group", str, required=True),
        # "product_image": FieldSpec("product_image", str),
        # "forWeb": FieldSpec("for_web", bool),
        # "isPieceBased": FieldSpec("is_piece_based", bool),
    }

    def test_get_list(self) -> None:
        """Test that we can get a list of products."""
        return self._get_list_logic()

    def test_product_image_validation(self) -> None:
        self._image_field_validation_logic(
            model=self.model,
            field_name="product_image",
        )


class PriceHistoryTestHost(Protocol):
    """
    Defines the public contract for a price history test host.

    Represents a structural protocol for objects that provide the shared factory
    dependency required by price history test host implementations. Implementations
    can conform to this protocol by exposing the documented public attribute.
    """

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
    """
    Provides a reusable base for price history tests that verify retrieval of the
    most recent sales price for a product within a configured context.

    Centralizes shared assertions for implementations that
    store price history records by contextual entity, product, and date. Subclasses
    are expected to provide the required factory and context field configuration
    before the inherited tests are executed.
    """

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
