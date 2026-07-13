from django.db.models import QuerySet
from drf_spectacular.utils import OpenApiParameter
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser

from catalog.models import PurchasePriceHistory
from core.api.mixins import SoftDeleteResponseMixin
from core.openapi import ERRORS_DETAIL
from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
    BaseUpdateGenericAPIView,
)
from stock.models import Warehouse
from stock.warehouse_serializers import (
    WarehouseListCreateSerializer,
    WarehouseMapSerializer,
    WarehousePriceHistorySerializer,
)


class BaseWarehouseGenericAPIView(generics.GenericAPIView):
    """
    Base view for warehouse operations.
    """

    queryset = Warehouse.objects.active()

    serializer_class = WarehouseListCreateSerializer


class WarehouseListCreateAPIView(BaseListCreateAPIView, BaseWarehouseGenericAPIView):
    """
    View for listing and creating warehouses.
    """

    resource_name = "warehouse"
    schema_tags = ["Warehouse"]
    read_serializer_class = WarehouseListCreateSerializer
    write_serializer_class = WarehouseListCreateSerializer


class WarehouseRetrieveUpdateDestroyAPIView(
    SoftDeleteResponseMixin,
    BaseRetrieveUpdateDestroyAPIView,
    BaseWarehouseGenericAPIView,
):
    """
    View for retrieving, updating, and deleting warehouses.
    """

    resource_name = "warehouse"
    schema_tags = ["Warehouse"]
    read_serializer_class = WarehouseListCreateSerializer
    write_serializer_class = WarehouseListCreateSerializer


class WarehouseUploadMapAPIView(BaseUpdateGenericAPIView):
    """
    View for uploading a warehouse map.
    """

    http_method_names = ["patch", "options", "head"]

    resource_name = "warehouse"
    schema_tags = ["Warehouse"]
    update_serializer_class = WarehouseMapSerializer
    errors_read = ERRORS_DETAIL

    queryset = Warehouse.objects.all()
    serializer_class = WarehouseMapSerializer

    parser_classes = (MultiPartParser, FormParser)


class WarehousePricesListAPIView(BaseListAPIView):
    """
    Provides the latest warehouse prices for specific products.
    """

    resource_name = "Warehouse Prices"
    schema_tags = ["Warehouse"]
    schema_parameters = [
        OpenApiParameter(
            name="products",
            type=int,
            location=OpenApiParameter.QUERY,
            required=True,
            many=True,
            description="Product ids. Example: ?products=1&products=2&products=3",
        ),
    ]

    serializer_class = WarehousePriceHistorySerializer

    def get_queryset(self) -> QuerySet[PurchasePriceHistory]:
        """
        Retrieves a queryset of `PurchasePriceHistory` objects filtered by provided product IDs
        and associated with a specific warehouse. If no product IDs are specified, an empty
        queryset is returned.

        Raises:
            ValidationError: Raised when one or more product IDs in the query
                parameters cannot be converted to integers.

        Returns:
            QuerySet[PurchasePriceHistory]: A queryset of `PurchasePriceHistory` objects filtered by product IDs and
                corresponding to the latest prices for the specified warehouse.
        """
        product_ids_raw = self.request.query_params.getlist("products")

        if not product_ids_raw:
            return PurchasePriceHistory.objects.none()

        try:
            product_ids = [int(product_id) for product_id in product_ids_raw]
        except ValueError as exc:
            raise ValidationError(
                {"products": ["Product ids must be integers."]}
            ) from exc

        return PurchasePriceHistory.objects.latest_prices_for_warehouse_products(
            warehouse_id=self.kwargs["pk"],
            product_ids=product_ids,
        )
