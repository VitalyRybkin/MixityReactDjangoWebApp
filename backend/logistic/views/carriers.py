from typing import Any

from django.db.models import Prefetch, QuerySet
from rest_framework import generics, status
from rest_framework.generics import GenericAPIView, get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from logistic.models import Carrier, Driver, Truck
from logistic.schemas.schema_carriers import (
    carrier_list_create_schema,
    carrier_resources_schema,
    carrier_retrieve_update_destroy_schema,
)
from logistic.serializers.carrier_serializers import (
    CarrierResourcesSerializer,
    CarrierSerializer,
)


class CarrierBaseAPIView(GenericAPIView):
    """
    Handles listing and creating `Carrier` objects.

    :ivar serializer_class: The serializer class is used for handling serialization
        and deserialization of Carrier objects.
    :type serializer_class: type

    :ivar permission_classes: List of permission classes required to access the
        view. Defaults to allowing any user.
    :type permission_classes: list
    """

    serializer_class = CarrierSerializer
    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet[Carrier]:
        _trucks_qs = Truck.objects.select_related("type", "capacity")
        return Carrier.objects.active().prefetch_related(
            Prefetch("carrier_trucks", queryset=_trucks_qs),
        )


@carrier_list_create_schema
class CarrierListCreateAPIView(CarrierBaseAPIView, generics.ListCreateAPIView):
    """
    Handles the creation and retrieval of `Carrier` objects.
    """

    pass


@carrier_retrieve_update_destroy_schema
class CarrierRetrieveUpdateDestroyAPIView(
    CarrierBaseAPIView, generics.RetrieveUpdateDestroyAPIView
):
    """
    Handles retrieving, updating, or deleting a `Carrier` object.

    :ivar serializer_class: Serializer class to be used for the Carrier instances.
    :type serializer_class: class
    :ivar queryset: Queryset defining the Carrier objects to be managed by this view.
    :type queryset: QuerySet
    """

    def perform_destroy(self, instance: Carrier) -> None:
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        self.perform_destroy(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


@carrier_resources_schema
class CarrierResourcesAPIView(generics.GenericAPIView):
    """
    Handles APIs related to carrier resources.

    Provides an endpoint for retrieving information about a carrier's associated
    resources, such as trucks. The view implements a GET request for retrieving
    the data and returns serialized results for specified resources.

    :ivar permission_classes: Indicates the permission classes applied to the API
        view. Specifies the permissions required for accessing the endpoint.
    :type permission_classes: list

    :ivar serializer_class: The serializer class used for serializing the carrier
        resources data.
    :type serializer_class: type
    """

    permission_classes = [AllowAny]
    serializer_class = CarrierResourcesSerializer

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        carrier = get_object_or_404(Carrier, pk=kwargs["pk"], is_active=True)

        trucks = Truck.objects.filter(carrier=carrier)
        drivers = Driver.objects.filter(carrier=carrier)

        serializer = self.get_serializer(
            {
                "trucks": trucks,
                "drivers": drivers,
            },
            context={"request": request},
        )

        return Response(serializer.data, status=status.HTTP_200_OK)
