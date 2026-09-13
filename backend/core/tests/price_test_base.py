import logging

from rest_framework import status
from rest_framework.reverse import reverse

from catalog.api.serializers.product_serializers import (
    PurchasePriceHistoryReadSerializer,
    SalesPriceHistoryReadSerializer,
)
from catalog.models import PurchasePriceHistory, SalesPriceHistory
from catalog.tests.api.factories import (
    PurchasePriceHistoryFactory,
    SalePriceHistoryFactory,
)
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec

logger = logging.getLogger(__name__)


class BasePriceContractMixin(BaseAPIMixin):
    entity_name: str

    def get_url_kwargs(self) -> dict[str, int]:
        return {
            "pk": self.obj.product_id,
        }

    def get_query_params(self) -> dict:
        return {
            self.entity_name: getattr(
                self.obj,
                f"{self.entity_name}_id",
            ),
        }

    def get_permission_test_params(self) -> dict:
        return self.get_query_params()

    def _get_prices_filtered_by(self, price_id: int) -> None:
        assert self.url is not None
        self._logger_header(f"ENDPOINT GET: {self.url}")

        response = self.client.get(
            self.url,
            self.get_query_params(),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        data = response.data

        if isinstance(data, dict):
            items = data.get("results", [])
        else:
            items = data

        self.assertEqual(
            len(items),
            1,
        )

        self.assertEqual(
            items[0]["id"],
            price_id,
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ "
            f"Prices filtered by {self.entity_name}"
            f"{self.COLOR['END']}"
        )

    def _duplicated_date_product_entity_name_returns_400(
        self,
        payload: dict,
    ) -> None:
        assert self.url is not None
        self._logger_header(f"ENDPOINT POST: {self.url}")

        response = self.client.post(
            self.url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        entity_id = getattr(
            self.obj,
            f"{self.entity_name}_id",
        )

        print(
            f"{self.INDENT}{self.COLOR['ERR']}✗ "
            f"{self.COLOR['OK']}Duplicate rejected | "
            f"date={self.obj.date}, "
            f"product={self.obj.product_id}, "
            f"{self.entity_name}={entity_id}"
            f"{self.COLOR['END']}"
        )

    def _same_date_entity_name_different_product_allowed(
        self, payload: dict, product_id: int
    ) -> None:
        """Test different product allowed"""
        assert self.pk_url_name is not None

        url = reverse(
            self.pk_url_name,
            kwargs={"pk": product_id},
        )

        self._logger_header(f"ENDPOINT POST: {url}")

        response = self.client.post(
            url,
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ "
            f"Same date/{self.entity_name} with different product allowed | "
            f"product={product_id}"
            f"{self.COLOR['END']}"
        )


class SalePricesBaseTest:
    model = SalesPriceHistory
    factory = SalePriceHistoryFactory
    fields_map = {
        "date": FieldSpec("date", str, required=True),
        "customer": FieldSpec("customer", int, required=True),
        "sale_price": FieldSpec("sale_price", float, required=True),
    }

    def get_serializer(self) -> SalesPriceHistoryReadSerializer:
        return SalesPriceHistoryReadSerializer()


class PurchasePricesBaseTest:
    model = PurchasePriceHistory
    factory = PurchasePriceHistoryFactory
    fields_map = {
        "date": FieldSpec("date", str, required=True),
        "warehouse": FieldSpec("warehouse", int, required=True),
        "purchase_price": FieldSpec("purchase_price", float, required=True),
    }

    def get_serializer(self) -> PurchasePriceHistoryReadSerializer:
        return PurchasePriceHistoryReadSerializer()
