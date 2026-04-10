from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from core.openapi.base_views import BaseGenericAPIView
from order.models import Client, Customer
from order.serializers.order_serializers.create_order_serializers import (
    OrderResourcesSerializer,
)


class OrderResourcesAPIView(BaseGenericAPIView):
    resource_name = "Order resources"
    schema_tags = ["Order"]
    read_serializer_class = OrderResourcesSerializer

    permission_classes = [AllowAny]
    serializer_class = OrderResourcesSerializer

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        clients = Client.objects.active()
        customers = Customer.objects.active()

        serializer = self.get_serializer(
            {
                "clients": clients,
                "customers": customers,
            },
            context={"request": request},
        )

        return Response(serializer.data, status=status.HTTP_200_OK)
