from typing import Any

from django.db.models import Prefetch, QuerySet
from rest_framework import generics, status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from carrier.models import Carrier, Truck
from carrier.schemas.schema_carriers import (
    carrier_list_create_schema,
    carrier_retrieve_update_destroy_schema,
)
from carrier.serializers.carrier_serializers import CarrierSerializer


class CarrierBaseAPIView(GenericAPIView):
    serializer_class = CarrierSerializer
    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet[Carrier]:
        _trucks_qs = Truck.objects.select_related("type", "capacity")
        return Carrier.objects.filter(is_active=True).prefetch_related(
            Prefetch("trucks", queryset=_trucks_qs)
        )


@carrier_list_create_schema
class CarrierListCreateAPIView(CarrierBaseAPIView, generics.ListCreateAPIView):
    pass


@carrier_retrieve_update_destroy_schema
class CarrierRetrieveUpdateDestroyAPIView(
    CarrierBaseAPIView, generics.RetrieveUpdateDestroyAPIView
):
    def perform_destroy(self, instance: Carrier) -> None:
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        self.perform_destroy(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
