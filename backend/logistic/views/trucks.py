from typing import Any

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from logistic.models import Truck, TruckCapacity, TruckType
from logistic.schemas.schema_trucks import (
    truck_capacity_list_create_schema,
    truck_capacity_retrieve_update_destroy_schema,
    truck_list_create_schema,
    truck_retrieve_update_destroy_schema,
    truck_type_list_create_schema,
    truck_type_retrieve_update_destroy_schema,
)
from logistic.serializers.truck_serializers import (
    TruckCapacityReadSerializer,
    TruckCapacityWriteSerializer,
    TruckReadSerializer,
    TruckSerializer,
    TruckTypeSerializer,
)


@truck_list_create_schema
class TruckListCreateAPIView(generics.ListCreateAPIView):
    """
    View responsible for listing and creating Truck objects.

    Attributes:
        queryset: A QuerySet of Truck objects with related fields `truck_type`,
        `capacity`, and `carrier` preloaded for efficient data retrieval.
    """

    queryset = Truck.objects.select_related("truck_type", "capacity", "carrier")
    permission_classes = [AllowAny]

    def get_serializer_class(self) -> type[TruckReadSerializer | TruckSerializer]:
        if self.request.method == "GET":
            return TruckReadSerializer
        return TruckSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        data = TruckReadSerializer(obj, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


@truck_retrieve_update_destroy_schema
class TruckRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles retrieval, updating, and deletion of Truck objects.

    Attributes:
        queryset: A queryset that prefetches related fields for optimized
                  database queries. Specifically includes related truck_type,
                  capacity, and carrier for each Truck instance.
    """

    queryset = Truck.objects.select_related("truck_type", "capacity", "carrier")
    permission_classes = [AllowAny]

    def get_serializer_class(self) -> type[TruckReadSerializer | TruckSerializer]:
        if self.request.method == "GET":
            return TruckReadSerializer
        return TruckSerializer

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        data = TruckReadSerializer(obj, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        self.perform_destroy(instance)

        data = TruckReadSerializer(instance, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


@truck_capacity_list_create_schema
class TruckCapacitiesListCreateAPIView(generics.ListCreateAPIView):
    """
    Handling the listing and creation of truck capacity records.

    Attributes:
        queryset: Specifies the model queryset for retrieving truck capacity
        objects.
        serializer_class: Defines the serializer to be used to validate and
        transform truck capacity data.
        permission_classes: Lists the permissions required to access the API,
        allowing unrestricted access in this case.
    """

    queryset = TruckCapacity.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(
        self,
    ) -> type[TruckCapacityReadSerializer | TruckCapacityWriteSerializer]:
        if self.request.method == "GET":
            return TruckCapacityReadSerializer
        return TruckCapacityWriteSerializer


@truck_capacity_retrieve_update_destroy_schema
class TruckCapacitiesRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    Handles retrieving, updating, or deleting a `TruckCapacity` object.

    Attributes:
        queryset: Specifies the model queryset for retrieving truck capacity
        objects.
        serializer_class: Defines the serializer to be used to validate and
        transform truck capacity data.
        permission_classes: Lists the permissions required to access the API,
        allowing unrestricted access in this case.
    """

    queryset = TruckCapacity.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckCapacityWriteSerializer


@truck_type_list_create_schema
class TruckTypesListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles listing and creating `TruckType` objects.

    Attributes:
        queryset: Specifies the model queryset for retrieving truck type
        objects.
        serializer_class: Defines the serializer to be used to validate and
        transform truck type data.
        permission_classes: Lists the permissions required to access the API,
        allowing unrestricted access in this case.
    """

    queryset = TruckType.objects.all()
    serializer_class = TruckTypeSerializer
    permission_classes = [AllowAny]


@truck_type_retrieve_update_destroy_schema
class TruckTypeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles retrieving, updating, or deleting a `TruckType` object.

    Attributes:
        queryset: Specifies the model queryset for retrieving truck type
        objects.
        serializer_class: Defines the serializer to be used to validate and
        transform truck type data.
        permission_classes: Lists the permissions required to access the API,
        allowing unrestricted access in this case.
    """

    queryset = TruckType.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckTypeSerializer
