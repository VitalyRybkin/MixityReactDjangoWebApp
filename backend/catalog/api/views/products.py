from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.serializers import BaseSerializer

from catalog.api.pagination import PriceHistoryPagination
from catalog.api.serializers.product_serializers import (
    ProductListAPISerializer,
    PurchasePriceHistoryReadSerializer,
    PurchasePriceHistoryUpdateSerializer,
    PurchasePriceHistoryWriteSerializer,
    SalesPriceHistoryReadSerializer,
    SalesPriceHistoryUpdateSerializer,
    SalesPriceHistoryWriteSerializer,
)
from catalog.models import (
    Product,
    PurchasePriceHistory,
    SalesPriceHistory,
)
from core.openapi import ERRORS_DETAIL
from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class BaseProductGenericAPIView(generics.GenericAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductListAPISerializer


class ProductListAPIView(BaseListAPIView, BaseProductGenericAPIView):
    resource_name = "product_list"
    schema_tags = ["Product"]
    read_serializer_class = ProductListAPISerializer


def get_required_int_query_param(request: Request, name: str) -> int:
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


class ProductPurchasePriceListCreateAPIView(BaseListCreateAPIView):
    resource_name = "product_purchase_prices"
    schema_tags = ["Product"]

    read_serializer_class = PurchasePriceHistoryReadSerializer
    write_serializer_class = PurchasePriceHistoryWriteSerializer

    pagination_class = PriceHistoryPagination

    schema_parameters = [
        OpenApiParameter(
            "warehouse",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=True,
        ),
    ]

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.request.method == "GET":
            return self.read_serializer_class
        return self.write_serializer_class

    def get_queryset(self) -> QuerySet[PurchasePriceHistory]:
        product_id = self.kwargs["pk"]

        get_object_or_404(
            Product.objects.only("id"),
            pk=product_id,
        )

        queryset = (
            PurchasePriceHistory.objects.filter(product_id=product_id)
            .select_related("warehouse")
            .order_by("-date")
        )

        if self.request.method == "GET":
            warehouse_id = get_required_int_query_param(
                self.request,
                "warehouse",
            )

            queryset = queryset.filter(
                warehouse_id=warehouse_id,
            )

        return queryset

    def perform_create(
        self,
        serializer: BaseSerializer,
    ) -> None:
        product = get_object_or_404(
            Product.objects.only("id"),
            pk=self.kwargs["pk"],
        )

        serializer.save(product=product)


class ProductSalesPriceListCreateAPIView(BaseListCreateAPIView):
    resource_name = "product_sales_prices"
    schema_tags = ["Product"]

    read_serializer_class = SalesPriceHistoryReadSerializer
    write_serializer_class = SalesPriceHistoryWriteSerializer

    pagination_class = PriceHistoryPagination

    schema_parameters = [
        OpenApiParameter(
            "customer",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=True,
        ),
    ]

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.request.method == "GET":
            return self.read_serializer_class
        return self.write_serializer_class

    def get_queryset(self) -> QuerySet[SalesPriceHistory]:
        product_id = self.kwargs["pk"]

        get_object_or_404(
            Product.objects.only("id"),
            pk=product_id,
        )

        queryset = (
            SalesPriceHistory.objects.filter(product_id=product_id)
            .select_related("customer")
            .order_by("-date")
        )

        if self.request.method == "GET":
            customer_id = get_required_int_query_param(
                self.request,
                "customer",
            )

            queryset = queryset.filter(
                customer_id=customer_id,
            )

        return queryset

    def perform_create(
        self,
        serializer: BaseSerializer,
    ) -> None:
        product = get_object_or_404(
            Product.objects.only("id"),
            pk=self.kwargs["pk"],
        )

        serializer.save(product=product)


class ProductRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView,
    BaseProductGenericAPIView,
):
    resource_name = "product_detail"
    schema_tags = ["Product"]

    read_serializer_class = ProductListAPISerializer
    write_serializer_class = ProductListAPISerializer


class ProductPurchasePriceRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView,
):
    resource_name = "product_purchase_price"
    schema_tags = ["ProductPurchasePrice"]
    errors_read = ERRORS_DETAIL

    queryset = PurchasePriceHistory.objects.select_related(
        "warehouse",
    )

    read_serializer_class = PurchasePriceHistoryReadSerializer
    write_serializer_class = PurchasePriceHistoryUpdateSerializer

    serializer_class = PurchasePriceHistoryReadSerializer


class ProductSalesPriceRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView,
):
    resource_name = "product_sales_price"
    schema_tags = ["ProductSalesPrice"]
    errors_read = ERRORS_DETAIL

    queryset = SalesPriceHistory.objects.select_related(
        "customer",
    )

    read_serializer_class = SalesPriceHistoryReadSerializer
    write_serializer_class = SalesPriceHistoryUpdateSerializer

    serializer_class = SalesPriceHistoryReadSerializer
