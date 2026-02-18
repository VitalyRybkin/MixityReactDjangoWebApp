from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny

from core.openapi import ERRORS_DETAIL
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
    BaseUpdateGenericAPIView,
)
from stock.models import Warehouse
from stock.warehouse_serializers import (
    WarehouseListCreateSerializer,
    WarehouseMapSerializer,
)


class BaseWarehouseGenericAPIView(generics.GenericAPIView):
    queryset = Warehouse.objects.all()
    permission_classes = [AllowAny]
    serializer_class = WarehouseListCreateSerializer


class WarehouseListCreateAPIView(BaseListCreateAPIView, BaseWarehouseGenericAPIView):
    resource_name = "warehouse"
    schema_tags = ["Warehouse"]
    read_serializer_class = WarehouseListCreateSerializer
    write_serializer_class = WarehouseListCreateSerializer


class WarehouseRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView, BaseWarehouseGenericAPIView
):
    resource_name = "warehouse"
    schema_tags = ["Warehouse"]
    read_serializer_class = WarehouseListCreateSerializer
    request_serializer_class = WarehouseListCreateSerializer


class WarehouseUploadMapAPIView(BaseUpdateGenericAPIView):
    http_method_names = ["patch", "options", "head"]

    resource_name = "warehouse"
    schema_tags = ["Warehouse"]
    update_serializer_class = WarehouseMapSerializer
    errors_read = ERRORS_DETAIL

    queryset = Warehouse.objects.all()
    serializer_class = WarehouseMapSerializer
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)
