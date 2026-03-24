from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny

from core.mixins import SoftDeleteResponseMixin
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
    """
    Base view for warehouse operations.
    """

    queryset = Warehouse.objects.active()
    permission_classes = [AllowAny]
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
    View for uploading warehouse map.
    """

    http_method_names = ["patch", "options", "head"]

    resource_name = "warehouse"
    schema_tags = ["Warehouse"]
    update_serializer_class = WarehouseMapSerializer
    errors_read = ERRORS_DETAIL

    queryset = Warehouse.objects.all()
    serializer_class = WarehouseMapSerializer
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)
