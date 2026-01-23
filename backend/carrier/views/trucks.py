from typing import Any

from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from carrier.models import Truck, TruckCapacity, TruckType
from carrier.serializers.truck_serializers import (
    TruckCapacitySerializer,
    TruckSerializer,
    TruckTypeSerializer,
)


@extend_schema_view(
    get=extend_schema(
        operation_id="listTrucks",
        summary="List trucks",
        tags=["Truck"],
    ),
    post=extend_schema(
        operation_id="createTruck",
        summary="Create a new truck",
        tags=["Truck"],
    ),
)
class TruckListCreateAPIView(generics.ListCreateAPIView):
    queryset = Truck.objects.all()
    serializer_class = TruckSerializer
    permission_classes = [AllowAny]


@extend_schema_view(
    get=extend_schema(
        operation_id="getTruck",
        summary="Retrieve a truck",
        tags=["Truck"],
    ),
    patch=extend_schema(
        operation_id="patchTruck",
        summary="Partially update a truck",
        tags=["Truck"],
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruck",
        summary="Deactivate (soft delete) a truck",
        tags=["Truck"],
        responses={200: OpenApiResponse(response=TruckSerializer)},
    ),
)
class TruckRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Truck.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckSerializer


@extend_schema_view(
    get=extend_schema(
        operation_id="listTruckCapacities",
        summary="List truck capacities",
        tags=["TruckCapacity"],
    ),
    post=extend_schema(
        operation_id="createTruckCapacity",
        summary="Create a new truck capacity",
        tags=["TruckCapacity"],
    ),
)
class TruckCapacitiesListCreateAPIView(generics.ListCreateAPIView):
    queryset = TruckCapacity.objects.all()
    serializer_class = TruckCapacitySerializer
    permission_classes = [AllowAny]


@extend_schema_view(
    get=extend_schema(
        operation_id="getTruckCapacity",
        summary="Retrieve a truck capacity",
        tags=["TruckCapacity"],
    ),
    patch=extend_schema(
        operation_id="patchTruckCapacity",
        summary="Partially update a truck capacity",
        tags=["TruckCapacity"],
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruckCapacity",
        summary="Deactivate (soft delete) a truck capacity",
        tags=["TruckCapacity"],
        responses={200: OpenApiResponse(response=TruckCapacitySerializer)},
    ),
)
class TruckCapacitiesRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = TruckCapacity.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckCapacitySerializer

    @extend_schema(
        operation_id="listTruckCapacities",
        summary="List truck capacities",
        tags=["TruckCapacity"],
    )
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return super().get(request, *args, **kwargs)


@extend_schema_view(
    get=extend_schema(
        operation_id="listTruckTypes",
        summary="List truck types",
        tags=["TruckType"],
    ),
    post=extend_schema(
        operation_id="createTruckType",
        summary="Create a new truck type",
        tags=["TruckType"],
    ),
)
class TruckTypesListCreateAPIView(generics.ListCreateAPIView):
    queryset = TruckType.objects.all()
    serializer_class = TruckTypeSerializer
    permission_classes = [AllowAny]


@extend_schema_view(
    get=extend_schema(
        operation_id="getTruckType",
        summary="Retrieve a truck type",
        tags=["TruckType"],
    ),
    patch=extend_schema(
        operation_id="patchTruckType",
        summary="Partially update a truck type",
        tags=["TruckType"],
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruckType",
        summary="Deactivate (soft delete) a truck type",
        tags=["TruckType"],
        responses={200: OpenApiResponse(response=TruckTypeSerializer)},
    ),
)
class TruckTypeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TruckType.objects.all()
    permission_classes = [AllowAny]
    serializer_class = TruckTypeSerializer
