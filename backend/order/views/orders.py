from typing import Any

from django.db.models import Q, QuerySet
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from catalog.models import Product
from core.openapi import ERRORS_DETAIL, ERRORS_DETAIL_WRITE
from core.openapi.base_views import (
    BaseGenericAPIView,
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from order.api.permissions import OrderResourcesPermission
from order.models import Client, Customer, Order, PackType
from order.serializers.order_serializers.create_order_serializers import (
    OrderReadSerializer,
    OrderResourcesSerializer,
    OrdersExportReadSerializer,
    OrderWriteSerializer,
)
from stock.models import Warehouse


class OrderResourcesAPIView(BaseGenericAPIView):
    """
    API view for fetching order-related resources.
    Provides a way to retrieve various order-related resources, such as clients, customers,

    Attributes:
        resource_name: A string representing the name of this resource.
        schema_tags: A list of strings used to tag the schema for documentation purposes.
        read_serializer_class: The serializer class for reading the data.
        serializer_class: The default serializer class for data manipulation.

    Methods:
        get(request, *args, **kwargs):
            Handles GET requests to provide the specified order-related resources.
    """

    resource_name = "Order resources"
    schema_tags = ["Order"]
    read_serializer_class = OrderResourcesSerializer

    serializer_class = OrderResourcesSerializer
    queryset = Client.objects.none()

    permission_classes = [
        IsAuthenticated,
        OrderResourcesPermission,
    ]

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        clients = Client.objects.active()
        customers = Customer.objects.active().prefetch_related("customer_objects")
        products = Product.objects.prefetch_related(
            "unit_config",
            "product_pallets",
        ).all()
        warehouses = Warehouse.objects.active()
        pack_types = PackType.objects.all()

        serializer = self.get_serializer(
            {
                "clients": clients,
                "customers": customers,
                "products": products,
                "warehouses": warehouses,
                "pack_types": pack_types,
            },
            context={"request": request},
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderListCreateAPIView(BaseListCreateAPIView):
    """
    Handles the creation and retrieval of Order instances.
    Provides a way to create new orders and retrieve a list of existing orders based on

    Attributes:
        resource_name (str): A string representing the resource name, "Order".
        schema_tags (list): Tags for schema documentation, in this case, ["Order"].
        read_serializer_class: Serializer used for read operations.
        write_serializer_class: Serializer used for write operations.
        errors_read: Error details used for read operations.
        errors_write: Error details used for write operations.
        query_parameters: List of query parameters used for filtering the retrieved data.

    Methods:
        get_queryset: Retrieves and filters the query set of orders based on the provided query
        parameters (date range, status, or customer ID). Orders are sorted by delivery date and
        creation time.

        get_serializer_class: Returns the appropriate serializer class depending on the HTTP request
        method.
    """

    resource_name = "Order"
    schema_tags = ["Order"]
    read_serializer_class = OrderReadSerializer
    write_serializer_class = OrderWriteSerializer
    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE
    query_parameters = [
        OpenApiParameter("date_from", OpenApiTypes.DATE, OpenApiParameter.QUERY),
        OpenApiParameter("date_to", OpenApiTypes.DATE, OpenApiParameter.QUERY),
        OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
        OpenApiParameter("customer", OpenApiTypes.INT, OpenApiParameter.QUERY),
        OpenApiParameter("warehouse", OpenApiTypes.INT, OpenApiParameter.QUERY),
        OpenApiParameter("no_upd", OpenApiTypes.BOOL, OpenApiParameter.QUERY),
        OpenApiParameter("product_id", OpenApiTypes.INT, OpenApiParameter.QUERY),
        OpenApiParameter("samples", OpenApiTypes.BOOL, OpenApiParameter.QUERY),
    ]

    def get_queryset(self) -> QuerySet[Order]:
        queryset = Order.objects.select_related(
            "client",
            "customer",
            "warehouse",
        ).prefetch_related("order_products")

        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        order_status = self.request.query_params.get("status")
        customer_id = self.request.query_params.get("customer_id")
        warehouse_id = self.request.query_params.get("warehouse_id")
        no_upd = self.request.query_params.get("no_upd")
        product_id = self.request.query_params.get("product_id")

        if date_from:
            queryset = queryset.filter(delivery_date__gte=date_from)

        if date_to:
            queryset = queryset.filter(delivery_date__lte=date_to)

        if order_status:
            queryset = queryset.filter(status=order_status)

        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

        if "samples" in self.request.query_params:
            queryset = queryset.filter(samples=True)

        if no_upd in {"true", "1"}:
            queryset = queryset.filter(Q(upd_pdf__isnull=True) | Q(upd_pdf=""))

        if product_id:
            queryset = queryset.filter(order_products__id=product_id)

        return queryset.distinct().order_by(
            "-delivery_date",
            "-created_at",
        )

    def get_serializer_class(self) -> Any:
        if self.request.method == "POST":
            return self.write_serializer_class
        return self.read_serializer_class


class OrderRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """
    Handles retrieval, updating, and deletion of Order objects using HTTP methods.

    Allows read, write, and delete operations on Order objects and ensures
    appropriate serializers are used based on the HTTP method of the request.

    Attributes:
        resource_name: A string representing the name of the resource, in this case, "Order".
        schema_tags: A list of strings used for tagging the API documentation, in this case ["Order"].
        read_serializer_class: The serializer class used for reading Order objects.
        write_serializer_class: The serializer class used for writing or updating Order objects.
        errors_read: The dictionary or constant defining error messages used for read operations.
        errors_write: The dictionary or constant defining error messages used for write operations.
        queryset: The queryset to retrieve Order objects, prefetched with related "delivery" data.

    Methods:
        get_serializer_class: Determines the serializer class to be used, based on the request
            method. If the method is PUT or PATCH, it returns the write_serializer_class,
            otherwise, it returns the read_serializer_class.
    """

    resource_name = "Order"
    schema_tags = ["Order"]
    read_serializer_class = OrderReadSerializer
    write_serializer_class = OrderWriteSerializer
    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE

    queryset = Order.objects.all().prefetch_related("delivery")

    def get_serializer_class(self) -> type[OrderWriteSerializer | OrderReadSerializer]:
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return OrderWriteSerializer

        return OrderReadSerializer

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        serializer = OrderWriteSerializer(
            instance, context=self.get_serializer_context()
        )
        serializer.destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrdersDownloadAPIView(BaseListAPIView):
    """
    Represents a view that provides a way to download a list of orders.

    Intended to retrieve and display order-related data based on
    specified query parameters such as date range and order status.

    Attributes:
        resource_name: A string representing the name of the resource.
        schema_tags: A list of schema tags for grouping endpoints in API documentation.
        read_serializer_class: A serializer class for reading order data.
        errors_read: A detailed dictionary or constant for READ error responses.
        errors_write: A detailed dictionary or constant for WRITE error responses.
        schema_parameters: A list of OpenAPI parameters used to define query parameters
            expected in the API schema.
        serializer_class: Serializer class for the data that binds database models to
            API representation.
    """

    resource_name = "Orders export"
    schema_tags = ["Order"]
    read_serializer_class = OrdersExportReadSerializer
    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE
    schema_parameters = [
        OpenApiParameter("date_from", OpenApiTypes.DATE, OpenApiParameter.QUERY),
        OpenApiParameter("date_to", OpenApiTypes.DATE, OpenApiParameter.QUERY),
        OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
        OpenApiParameter("customer", OpenApiTypes.INT, OpenApiParameter.QUERY),
        OpenApiParameter("warehouse", OpenApiTypes.INT, OpenApiParameter.QUERY),
    ]

    serializer_class = OrdersExportReadSerializer

    def get_queryset(self) -> QuerySet[Order]:
        queryset = Order.objects.select_related("client", "delivery__driver")

        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        order_status = self.request.query_params.get("status")
        customer_id = self.request.query_params.get("customer")
        warehouse_id = self.request.query_params.get("warehouse")

        if date_from:
            queryset = queryset.filter(delivery_date__gte=date_from)

        if date_to:
            queryset = queryset.filter(delivery_date__lte=date_to)

        if order_status:
            queryset = queryset.filter(status=order_status)

        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

        return queryset.order_by("-delivery_date", "-created_at")
