from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from logistic.models import Truck, TruckCapacity, TruckType
from logistic.serializers.truck_serializers import (
    TruckCapacityReadSerializer,
    TruckCapacityWriteSerializer,
    TruckReadSerializer,
    TruckSerializer,
    TruckTypeSerializer,
)


class TruckListCreateAPIView(BaseListCreateAPIView):
    """
    View responsible for listing and creating Truck objects.

    Attributes:
        queryset: A QuerySet of Truck objects with related fields `truck_type`,
        `capacity`, and `carrier` preloaded for efficient data retrieval.
        read_serializer_class: Defines the serializer to be used for reading
        write_serializer_class: Defines the serializer to be used for writing
        resource_name: Name of the resource for API documentation
        schema_tags: Tags for API documentation
    """

    read_serializer_class = TruckReadSerializer
    write_serializer_class = TruckSerializer
    resource_name = "Truck"
    schema_tags = ["Truck"]

    queryset = Truck.objects.select_related("truck_type", "capacity", "carrier")
    permission_classes = [AllowAny]

    def get_serializer_class(self) -> type[TruckReadSerializer | TruckSerializer]:
        if self.request.method == "GET":
            return self.read_serializer_class
        return self.write_serializer_class

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        data = TruckReadSerializer(obj, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


class TruckRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """
    Handles retrieval, updating, and deletion of Truck objects.

    Attributes:
        queryset: A queryset that prefetches related fields for optimized
                  database queries. Specifically includes related truck_type,
                  capacity, and carrier for each Truck instance.
        read_serializer_class: Defines the serializer to be used for reading
        write_serializer_class: Defines the serializer to be used for writing
        resource_name: Name of the resource for API documentation
        schema_tags: Tags for API documentation
    """

    resource_name = "Truck"
    schema_tags = ["Truck"]
    read_serializer_class = TruckReadSerializer
    write_serializer_class = TruckSerializer

    queryset = Truck.objects.select_related("truck_type", "capacity", "carrier")
    permission_classes = [AllowAny]

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.request.method == "GET":
            return self.read_serializer_class
        return self.write_serializer_class

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        data = self.read_serializer_class(obj, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        self.perform_destroy(instance)

        data = TruckReadSerializer(instance, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


class TruckCapacitiesListCreateAPIView(BaseListCreateAPIView):
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

    read_serializer_class = TruckCapacityReadSerializer
    write_serializer_class = TruckCapacityWriteSerializer
    resource_name = "TruckCapacity"
    schema_tags = ["TruckCapacity"]
    queryset = TruckCapacity.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(
        self,
    ) -> type[TruckCapacityReadSerializer | TruckCapacityWriteSerializer]:
        if self.request.method == "GET":
            return self.read_serializer_class
        return self.write_serializer_class


class TruckCapacitiesRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """
    Handles retrieving, updating, or deleting a `TruckCapacity` object.

    Attributes:
        queryset: Specifies the model queryset for retrieving truck capacity
        objects.
        serializer_class: Defines the serializer to be used to validate and
        transform truck capacity data.
        permission_classes: Lists the permissions required to access the API,
        allowing unrestricted access in this case.
        resource_name: Name of the resource for API documentation
        schema_tags: Tags for API documentation
        write_serializer_class: Defines the serializer to be used for writing
        read_serializer_class: Defines the serializer to be used for reading
    """

    resource_name = "TruckCapacity"
    schema_tags = ["TruckCapacity"]
    read_serializer_class = TruckCapacityReadSerializer
    write_serializer_class = TruckCapacityWriteSerializer

    queryset = TruckCapacity.objects.all()
    permission_classes = [AllowAny]
    serializer_class = write_serializer_class


class TruckTypesListCreateAPIView(BaseListCreateAPIView):
    """
    Handles listing and creating `TruckType` objects.

    Attributes:
        queryset: Specifies the model queryset for retrieving truck type
        objects.
        serializer_class: Defines the serializer to be used to validate and
        transform truck type data.
        permission_classes: Lists the permissions required to access the API,
        allowing unrestricted access in this case.
        read_serializer_class: Defines the serializer to be used for reading
        write_serializer_class: Defines the serializer to be used for writing
        resource_name: Name of the resource for API documentation
        schema_tags: Tags for API documentation
    """

    read_serializer_class = TruckTypeSerializer
    write_serializer_class = TruckTypeSerializer
    resource_name = "TruckType"
    schema_tags = ["TruckType"]

    queryset = TruckType.objects.all()
    serializer_class = read_serializer_class
    permission_classes = [AllowAny]


class TruckTypeRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
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

    resource_name = "TruckType"
    schema_tags = ["TruckType"]
    read_serializer_class = TruckTypeSerializer
    write_serializer_class = TruckTypeSerializer

    queryset = TruckType.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckTypeSerializer
