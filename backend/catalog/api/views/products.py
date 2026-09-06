from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import generics
from rest_framework.exceptions import ValidationError

from catalog.api.pagination import PriceHistoryPagination
from catalog.api.serializers.product_serializers import (
    ProductListAPISerializer,
    PurchasePriceHistorySerializer,
    SalesPriceHistorySerializer,
)
from catalog.models import (
    Product,
    PurchasePriceHistory,
    SalesPriceHistory,
)
from core.openapi.base_views import BaseListAPIView


class BaseProductGenericAPIView(generics.GenericAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductListAPISerializer


class ProductListAPIView(BaseListAPIView, BaseProductGenericAPIView):
    resource_name = "product_list"
    schema_tags = ["Product"]
    read_serializer_class = ProductListAPISerializer


def get_required_int_query_param(request, name: str) -> int:
    value = request.query_params.get(name)

    if not value:
        raise ValidationError(
            {
                name: "Parameter is required.",
            }
        )

    try:
        value_int = int(value)
    except (TypeError, ValueError):
        raise ValidationError(
            {
                name: "Value must be an integer.",
            }
        )

    if value_int <= 0:
        raise ValidationError(
            {
                name: "Value must be a positive number.",
            }
        )

    return value_int


class ProductPurchasePriceListAPIView(BaseListAPIView):
    resource_name = "product_purchase_prices"
    schema_tags = ["Product"]

    read_serializer_class = PurchasePriceHistorySerializer
    serializer_class = PurchasePriceHistorySerializer

    pagination_class = PriceHistoryPagination

    schema_parameters = [
        OpenApiParameter(
            "warehouse",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=True,
        ),
    ]

    def get_queryset(self) -> QuerySet[PurchasePriceHistory]:
        product_id = self.kwargs["pk"]
        warehouse_id = get_required_int_query_param(
            self.request,
            "warehouse",
        )

        get_object_or_404(
            Product.objects.only("id"),
            pk=product_id,
        )

        return (
            PurchasePriceHistory.objects
            .filter(
                product_id=product_id,
                warehouse_id=warehouse_id,
            )
            .select_related("warehouse")
            .order_by("-date")
        )


class ProductSalesPriceListAPIView(BaseListAPIView):
    resource_name = "product_sales_prices"
    schema_tags = ["Product"]

    read_serializer_class = SalesPriceHistorySerializer
    serializer_class = SalesPriceHistorySerializer

    pagination_class = PriceHistoryPagination

    schema_parameters = [
        OpenApiParameter(
            "customer",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=True,
        ),
    ]

    def get_queryset(self) -> QuerySet[SalesPriceHistory]:
        product_id = self.kwargs["pk"]
        customer_id = get_required_int_query_param(
            self.request,
            "customer",
        )

        get_object_or_404(
            Product.objects.only("id"),
            pk=product_id,
        )

        return (
            SalesPriceHistory.objects
            .filter(
                product_id=product_id,
                customer_id=customer_id,
            )
            .select_related("customer")
            .order_by("-date")
        )