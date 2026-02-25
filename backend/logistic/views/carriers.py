from typing import Any

from django.db.models import Prefetch, QuerySet
from rest_framework import status
from rest_framework.generics import GenericAPIView, get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from core.openapi.base_views import (
    BaseGenericAPIView,
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from logistic.models import Carrier, Driver, Truck
from logistic.serializers.carrier_serializers import (
    CarrierResourcesSerializer,
    CarrierSerializer,
)
from logistic.serializers.driver_serializers import DriverSerializer
from logistic.serializers.truck_serializers import TruckSerializer


class CarrierBaseAPIView(GenericAPIView):
    """
    Handles listing and creating `Carrier` objects.

    Attributes:
        serializer_class: The serializer class is used for handling serialization
            and deserialization of Carrier objects.
        permission_classes: List of permission classes required to access the
            view. Defaults to allowing any user.
    """

    serializer_class = CarrierSerializer
    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet[Carrier]:
        _trucks_qs = Truck.objects.select_related("truck_type", "capacity")
        return Carrier.objects.active().prefetch_related(
            Prefetch("trucks", queryset=_trucks_qs),
        )


class CarrierListCreateAPIView(CarrierBaseAPIView, BaseListCreateAPIView):
    """
    Handles the creation and retrieval of `Carrier` objects.

    Attributes:
        resource_name: Name of the resource for API documentation purposes.
        schema_tags: Tags for API documentation.
        read_serializer_class: Serializer class used for reading Carrier data.
        write_serializer_class: Serializer class used for writing Carrier data.
    """

    resource_name = "Carrier"
    schema_tags = ["Carrier"]
    read_serializer_class = CarrierSerializer
    write_serializer_class = CarrierSerializer


class CarrierRetrieveUpdateDestroyAPIView(
    CarrierBaseAPIView, BaseRetrieveUpdateDestroyAPIView
):
    """
    Handles retrieving, updating, or deleting a `Carrier` object.

    Attributes:
        resource_name: Name of the resource for API documentation purposes.
        schema_tags: Tags for API documentation.
        read_serializer_class: Serializer class used for reading Carrier data.
        write_serializer_class: Serializer class used for writing Carrier data.
    """

    resource_name = "Carrier"
    schema_tags = ["Carrier"]
    read_serializer_class = CarrierSerializer
    write_serializer_class = CarrierSerializer

    def perform_destroy(self, instance: Carrier) -> None:
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        self.perform_destroy(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CarrierResourcesAPIView(BaseGenericAPIView):
    """
    Handles APIs related to carrier resources.

    Provides an endpoint for retrieving information about a carrier's associated
    resources, such as trucks. The view implements a GET request for retrieving
    the data and returns serialized results for specified resources.

    Attributes:
        resource_name: Name of the resource for API documentation purposes.
        schema_tags: Tags for API documentation.
        read_serializer_class: Serializer class used for reading Carrier data.
        serializer_class: Serializer class used for handling incoming request data.

    """

    resource_name = "Carrier resources"
    schema_tags = ["Carrier"]
    read_serializer_class = CarrierResourcesSerializer

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


class CarrierResourcesListAPIView(BaseListAPIView):
    """
    Handles listing of carrier resources such as trucks or drivers.

    Provides an API view to list trucks or drivers associated with a carrier.
    Uses different querysets and serializers based on the requested resource.

    Attributes:
        resource_name: Name of the resource being managed.
        schema_tags: List of schema tags used for the API documentation.
        permission_classes: List of permission classes applied to this view.
    """

    resource_name = ""
    schema_tags = []

    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet:
        pk = self.kwargs.get("pk")
        path = self.request.path.lower()

        if "trucks" in path:
            return Truck.objects.filter(carrier_id=pk).order_by("id")

        return Driver.objects.filter(carrier_id=pk).order_by("id")

    def get_serializer_class(self) -> type[TruckSerializer | DriverSerializer]:
        if "trucks" in self.request.path.lower():
            return TruckSerializer
        return DriverSerializer


class CarrierTruckListAPIView(CarrierResourcesListAPIView):
    """
    Manages the retrieval of carrier trucks in an API view.

    Provides functionality for listing carrier truck resources that belong to
    carriers. This view inherits common behavior from the CarrierResourcesListAPIView
    and customizes it for carrier truck-specific requirements. Designed to handle
    API-specific tasks including serialization and schema tagging.

    Attributes:
        resource_name: Name of the resource being managed, specific to carrier trucks.
        schema_tags: List of schema tags used for the API documentation.
        read_serializer_class: Serializer class used to serialize read requests
            for carrier trucks.
    """

    resource_name = "Carrier trucks"
    schema_tags = ["Carrier"]
    read_serializer_class = TruckSerializer


class CarrierDriverListAPIView(CarrierResourcesListAPIView):
    """
    Represents a view for listing carrier drivers.

    Provides functionality for listing carrier driver resources that belong to
    carriers. This view inherits common behavior from the CarrierResourcesListAPIView
    and customizes it for carrier truck-specific requirements. Designed to handle
    API-specific tasks including serialization and schema tagging.

    Attributes:
        resource_name: The name of the resource being represented.
        schema_tags: Tags used for schema documentation purposes, typically
            related to the resource category.
        read_serializer_class: Serializer class used to serialize read requests
            for carrier drivers.
    """

    resource_name = "Carrier drivers"
    schema_tags = ["Carrier"]
    read_serializer_class = DriverSerializer
