from typing import Any

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from core.openapi import ERRORS_DETAIL, ERRORS_DETAIL_WRITE
from core.openapi.base_views import BaseGenericAPIView, BaseListCreateAPIView
from order.models import Client, Customer, Order
from order.serializers.order_serializers.create_order_serializers import (
    OrderReadSerializer,
    OrderResourcesSerializer,
    OrderWriteSerializer,
)


class OrderResourcesAPIView(BaseGenericAPIView):
    resource_name = "Order resources"
    schema_tags = ["Order"]
    read_serializer_class = OrderResourcesSerializer

    permission_classes = [AllowAny]
    serializer_class = OrderResourcesSerializer

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        clients = Client.objects.active()
        customers = Customer.objects.active().prefetch_related("customer_objects")

        serializer = self.get_serializer(
            {
                "clients": clients,
                "customers": customers,
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

    def get_queryset(self):
        queryset = Order.objects.all()

        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        queryset = queryset.filter(delivery_date__gte=date_from, delivery_date__lte=date_to)

        return queryset

    def get_serializer_class(self) -> Any:
        if self.request.method == "POST":
            return self.write_serializer_class
        return self.read_serializer_class
