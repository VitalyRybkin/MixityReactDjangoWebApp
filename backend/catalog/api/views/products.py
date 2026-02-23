from rest_framework import generics
from rest_framework.permissions import AllowAny

from catalog.api.serializers.product_serializers import ProductListCreateAPISerializer
from catalog.models import Product
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class BaseProductGenericAPIView(generics.GenericAPIView):
    queryset = Product.objects.all()
    permission_classes = [AllowAny]
    serializer_class = ProductListCreateAPISerializer


class ProductListCreateAPIView(BaseListCreateAPIView, BaseProductGenericAPIView):
    resource_name = "product"
    schema_tags = ["Product"]
    read_serializer_class = ProductListCreateAPISerializer
    write_serializer_class = ProductListCreateAPISerializer


class ProductRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView, BaseProductGenericAPIView
):
    resource_name = "product"
    schema_tags = ["Product"]
    read_serializer_class = ProductListCreateAPISerializer
    write_serializer_class = ProductListCreateAPISerializer
