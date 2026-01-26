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
    Provides a base API view for carrier-related data.

    CarrierBaseAPIView is a generic API view that provides functionality for
    serializing and handling carrier-related data. It specifies a serializer class
    and defines permission requirements for accessing the view. The view
    customizes the queryset to include active carriers and prefetches related
    truck data, optimizing database queries.

    Attributes:
        serializer_class: The serializer class used for data validation and
                          representation.
        permission_classes: A list of permission classes that specify the
                            authorization required to access the view.

    Methods:
        get_queryset:
            Retrieves the queryset of active carriers from the database. The
            method prefetches related truck data with specific fields for
            optimized query performance.

    Raises:
        No explicit errors are raised by this class directly.
    """

    serializer_class = CarrierSerializer
    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet[Carrier]:
        _trucks_qs = Truck.objects.select_related("type", "capacity")
        return Carrier.objects.filter(is_active=True).prefetch_related(
            Prefetch("carrier_trucks", queryset=_trucks_qs)
        )


@carrier_list_create_schema
class CarrierListCreateAPIView(CarrierBaseAPIView, generics.ListCreateAPIView):
    """
    Handles the creation and listing of carrier entities.

    Serves as an API view to allow creating new carriers and retrieving
    a list of existing carriers. It extends the functionalities of CarrierBaseAPIView
    and Django REST Framework's ListCreateAPIView to provide this functionality.
    """

    pass


@carrier_retrieve_update_destroy_schema
class CarrierRetrieveUpdateDestroyAPIView(
    CarrierBaseAPIView, generics.RetrieveUpdateDestroyAPIView
):
    """
    API view for retrieving, updating, and deactivating a carrier.

    Provides functionality to retrieve, update, and
    deactivate carriers. When a carrier is deleted using this view, it is
    marked as inactive instead of being permanently removed from the database.
    This ensures that carrier records are retained while indicating they are
    no longer active.

    Inherits common functionality from CarrierBaseAPIView and
    generics.RetrieveUpdateDestroyAPIView.

    Methods:
        perform_destroy(instance: Carrier) -> None: Marks the specified carrier
        instance as inactive in the database.

        destroy(request: Request, *args: Any, **kwargs: Any) -> Response: Handles
        the delete operation by marking the carrier instance inactive, serializing
        it, and returning the updated data in the response.
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
