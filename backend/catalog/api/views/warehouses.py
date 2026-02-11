from rest_framework import generics
from rest_framework.permissions import AllowAny

from catalog.api.serializers.warehouse_serializers import WarehouseListCreateSerializer
from catalog.models import Warehouse
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
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
