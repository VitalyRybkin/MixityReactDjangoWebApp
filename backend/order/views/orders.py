from typing import Any

from django.db.models import QuerySet
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from catalog.models import Product
from core.openapi import ERRORS_DETAIL, ERRORS_DETAIL_WRITE
from core.openapi.base_views import (
    BaseGenericAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from order.models import Client, Customer, Order, PackType
from order.serializers.order_serializers.create_order_serializers import (
    OrderReadSerializer,
    OrderResourcesSerializer,
    OrderWriteSerializer,
)
from stock.models import Warehouse


class OrderResourcesAPIView(BaseGenericAPIView):
    resource_name = "Order resources"
    schema_tags = ["Order"]
    read_serializer_class = OrderResourcesSerializer

    permission_classes = [AllowAny]
    serializer_class = OrderResourcesSerializer

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        clients = Client.objects.active()
        customers = Customer.objects.active().prefetch_related("customer_objects")
        products = Product.objects.prefetch_related(
            "unit_config", "product_pallets"
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
    resource_name = "Order"
    schema_tags = ["Order"]
    read_serializer_class = OrderReadSerializer
    write_serializer_class = OrderWriteSerializer
    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE

    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet[Order]:
        queryset = Order.objects.select_related("client", "customer")

        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        order_status = self.request.query_params.get("status")
        customer_id = self.request.query_params.get("customer")

        if date_from:
            queryset = queryset.filter(delivery_date__gte=date_from)

        if date_to:
            queryset = queryset.filter(delivery_date__lte=date_to)

        if order_status:
            queryset = queryset.filter(status=order_status)

        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        return queryset.order_by("-delivery_date", "-created_at")

    def get_serializer_class(self) -> Any:
        if self.request.method == "POST":
            return self.write_serializer_class
        return self.read_serializer_class


class OrderRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    resource_name = "Order"
    schema_tags = ["Order"]
    read_serializer_class = OrderReadSerializer
    write_serializer_class = OrderWriteSerializer
    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE

    permission_classes = [AllowAny]
    queryset = Order.objects.all()

    def get_serializer_class(self) -> type[OrderWriteSerializer | OrderReadSerializer]:
        if self.request.method in ("PUT", "PATCH"):
            print("Handling PUT/PATCH request for Order")
            return OrderWriteSerializer

        return OrderReadSerializer
