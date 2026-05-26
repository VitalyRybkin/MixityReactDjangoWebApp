from typing import TYPE_CHECKING

from rest_framework.response import Response
from rest_framework.reverse import reverse

from catalog.models import PurchasePriceHistory, SalesPriceHistory

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


class QuerysetContractMixin(_Base):

    def get_detail_url(self, pk: int) -> str:
        """Returns the URL for retrieving a specific object by ID."""
        self.assertTrue(
            self.pk_url_name is not None,
            "pk_url_name must be set",
        )
        assert self.pk_url_name is not None
        return reverse(self.pk_url_name, kwargs={"pk": pk})

    def _get_latest_price(
        self,
        context_type_id: int,
        product_id: int,
        price_to_get: PurchasePriceHistory | SalesPriceHistory,
    ) -> Response:
        """
        Retrieves the latest price for a specific product within a context.
        """
        self._logger_header(
            f"ENDPOINT GET: {self.pk_url_name}/{context_type_id}/prices"
        )

        detail_url = self.get_detail_url(context_type_id)
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, 200)

        response = self.client.get(detail_url, {"products": [product_id]})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], price_to_get.id)

        print(
            f"    {self.COLOR['OK']}✓ Retrieval of latest price passed{self.COLOR['END']}"
        )

        return response

    def _get_latest_price_invalid_product_id(
        self,
        context_type_id: int,
        invalid_product_id: str,
    ) -> Response:
        """
        Retrieves the latest price for a specific product within a context, using an invalid product ID.
        """
        self._logger_header(
            f"ENDPOINT GET: {self.pk_url_name}/{context_type_id}/prices"
        )

        detail_url = self.get_detail_url(context_type_id)
        response = self.client.get(detail_url, {"products": [invalid_product_id]})
        self.assertEqual(response.status_code, 400)

        self.assertEqual(response.data, ["products: Product ids must be integers."])

        print(
            f"    {self.COLOR['OK']}✓ Retrieval of latest price with invalid product ID passed{self.COLOR['END']}"
        )

        return response
