from typing import Any

from django.db.models import QuerySet
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from carrier.models import Carrier
from carrier.serializers.carrier_serializers import CarrierSerializer


@extend_schema_view(
    get=extend_schema(
        operation_id="listCarriers",
        summary="List carriers",
        tags=["Carrier"],
    ),
    post=extend_schema(
        operation_id="createCarrier",
        summary="Create a new carrier",
        tags=["Carrier"],
    ),
)
class CarrierListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = CarrierSerializer
    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet[Carrier]:
        return Carrier.objects.filter(is_active=True)


@extend_schema_view(
    get=extend_schema(
        operation_id="getCarrier",
        summary="Retrieve a carrier",
        tags=["Carrier"],
    ),
    patch=extend_schema(
        operation_id="patchCarrier",
        summary="Partially update a carrier",
        tags=["Carrier"],
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteCarrier",
        summary="Deactivate (soft delete) a carrier",
        tags=["Carrier"],
        responses={200: OpenApiResponse(response=CarrierSerializer)},
    ),
)
class CarrierRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Carrier.objects.all()
    serializer_class = CarrierSerializer
    permission_classes = [AllowAny]

    def perform_destroy(self, instance: Carrier) -> None:
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        self.perform_destroy(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
