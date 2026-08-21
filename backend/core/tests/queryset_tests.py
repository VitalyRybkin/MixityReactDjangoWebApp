from typing import TYPE_CHECKING
from urllib.parse import urlencode

from rest_framework.response import Response
from rest_framework.reverse import reverse

from catalog.models import PurchasePriceHistory, SalesPriceHistory
from contacts.models import Contact

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

        detail_url = self.get_detail_url(context_type_id)
        self._logger_header(f"ENDPOINT GET: {detail_url}")
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, 200)

        response = self.client.get(detail_url, {"products": [product_id]})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], price_to_get.id)

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ Retrieval of latest price passed{self.COLOR['END']}"
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

        detail_url = self.get_detail_url(context_type_id)
        self._logger_header(f"ENDPOINT GET: {detail_url}")
        response = self.client.get(detail_url, {"products": [invalid_product_id]})
        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.data["messages"], ["products: Product ids must be integers."]
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            f"✓ Retrieval of latest price with invalid product ID passed"
            f"{self.COLOR['END']}"
        )

        return response

    def _get_object_related_entities_list(
        self,
        obj_id: int,
        expected_contacts: list[Contact],
        entity: str,
    ) -> None:
        """
        Retrieves the contact list for a specific object and compares it with the expected contacts.
        """

        detail_url = self.get_detail_url(obj_id)
        self._logger_header(f"ENDPOINT GET: {detail_url}")
        response = self.client.get(detail_url)

        self.assertEqual(response.status_code, 200)

        ids = {item["id"] for item in response.data}
        expected_ids = {contact.id for contact in expected_contacts}

        self.assertEqual(ids, expected_ids)

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ Retrieval of {entity} list passed{self.COLOR['END']}"
        )

    def _assert_filtered_count(self, expected_count: int, params: dict) -> None:
        """
        Asserts that the filtered queryset returns the expected count of results.
        """
        assert self.url_name is not None

        self._logger_header(
            f"ENDPOINT GET: {reverse(self.url_name)}?{urlencode(params)}"
        )

        response = self.client.get(reverse(self.url_name), data=params)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), expected_count)
        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ Retrieval of filtered queryset passed: "
            f"\n \t - response count - {len(response.data)}, expected count - {expected_count}{self.COLOR['END']}"
        )
