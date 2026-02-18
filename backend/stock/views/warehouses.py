from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny

from stock.warehouse_serializers import WarehouseListCreateSerializer, WarehouseMapSerializer
from stock.models import Warehouse
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)

from rest_framework.request import Request
from rest_framework.response import Response

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


class WarehouseUploadMapAPIView(generics.UpdateAPIView):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseMapSerializer
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)


    def perform_update(self, serializer):
        serializer.save()
