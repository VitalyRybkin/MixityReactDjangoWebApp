from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from carrier.models import Carrier
from carrier.serializers import CarrierSerializer


class CarrierDetailAPIView(generics.RetrieveAPIView):
    queryset = Carrier.objects.all()
    permission_classes = [AllowAny]
    serializer_class = CarrierSerializer

    @extend_schema(
        operation_id="retrieveCarrier",
        summary="Get carrier details",
    )
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return super().get(request, *args, **kwargs)


class CarrierListAPIView(generics.ListAPIView):
    queryset = Carrier.objects.all()
    permission_classes = [AllowAny]
    serializer_class = CarrierSerializer

    @extend_schema(
        operation_id="listCarriers",
        summary="List carriers",
    )
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return super().get(request, *args, **kwargs)
