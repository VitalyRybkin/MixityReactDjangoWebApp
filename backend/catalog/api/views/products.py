from rest_framework import generics

from catalog.api.serializers.product_serializers import ProductListAPISerializer
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
    BaseRetrieveUpdateDestroyAPIView, BaseProductGenericAPIView
):
    resource_name = "product_detail"
    schema_tags = ["Product"]
    read_serializer_class = ProductListAPISerializer
    write_serializer_class = ProductListAPISerializer
