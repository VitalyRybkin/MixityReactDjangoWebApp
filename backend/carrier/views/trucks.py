from typing import Any

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from carrier.models import Truck
from carrier.serializers import TruckSerializer


class TrucksListAPIView(generics.ListAPIView):
    queryset = Truck.objects.all()
    serializer_class = TruckSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="listTrucks",
        summary="List trucks",
    )
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return super().get(request, *args, **kwargs)


class TrucksDetailAPIView(generics.RetrieveAPIView):
    queryset = Truck.objects.all()
    serializer_class = TruckSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="retrieveTruck",
        summary="Get truck details",
        responses={
            404: OpenApiResponse(description="Truck not found"),
        },
    )
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return super().get(request, *args, **kwargs)
