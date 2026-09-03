from django.db.models import QuerySet
from rest_framework import generics

from catalog.api.serializers.product_serializers import (
    ProductListAPISerializer,
    ProductRetrieveUpdateAPISerializer,
)
from catalog.models import Product
from core.openapi.base_views import (
    BaseListAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class BaseProductGenericAPIView(generics.GenericAPIView):
    queryset = Product.objects.all()

    serializer_class = ProductListAPISerializer


class ProductListAPIView(BaseListAPIView, BaseProductGenericAPIView):
    resource_name = "product_list"
    schema_tags = ["Product"]
    read_serializer_class = ProductListAPISerializer


class ProductRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView,
):
    resource_name = "product_detail"
    schema_tags = ["Product"]

    serializer_class = ProductRetrieveUpdateAPISerializer

    read_serializer_class = ProductRetrieveUpdateAPISerializer
    write_serializer_class = ProductRetrieveUpdateAPISerializer

    def get_queryset(self) -> QuerySet[Product, Product]:
        return Product.objects.select_related(
            "unit_config",
            "unit_config__unit",
        ).prefetch_related(
            "purchase_price_history",
            "sales_price_history",
        )

    def get_serializer_class(self) -> type[ProductRetrieveUpdateAPISerializer]:
        if self.request.method == "GET":
            return self.read_serializer_class
        return self.write_serializer_class
