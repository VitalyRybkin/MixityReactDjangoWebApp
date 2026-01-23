"""
Provides schemas for truck-related API endpoints.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view

from logistic.schemas.schema_errors import (
    ERRORS_DETAIL,
    ERRORS_DETAIL_WRITE,
    ERRORS_READ,
    ERRORS_WRITE,
)
from logistic.serializers.truck_serializers import (
    TruckCapacitySerializer,
    TruckSerializer,
    TruckTypeSerializer,
)

truck_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listTrucks",
        summary="List trucks",
        tags=["Truck"],
        responses={200: TruckSerializer(many=True), **ERRORS_READ},
    ),
    post=extend_schema(
        operation_id="createTruck",
        summary="Create a new truck",
        tags=["Truck"],
        responses={201: TruckSerializer, **ERRORS_WRITE},
    ),
)

truck_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getTruck",
        summary="Retrieve a truck",
        tags=["Truck"],
        responses={200: OpenApiResponse(response=TruckSerializer), **ERRORS_DETAIL},
    ),
    patch=extend_schema(
        operation_id="patchTruck",
        summary="Partially update a truck",
        tags=["Truck"],
        responses={
            200: OpenApiResponse(response=TruckSerializer),
            **ERRORS_DETAIL_WRITE,
        },
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruck",
        summary="Deactivate (soft delete) a truck",
        tags=["Truck"],
        responses={200: OpenApiResponse(response=TruckSerializer), **ERRORS_DETAIL},
    ),
)

truck_capacity_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listTruckCapacities",
        summary="List truck capacities",
        tags=["TruckCapacity"],
        responses={200: TruckCapacitySerializer(many=True), **ERRORS_READ},
    ),
    post=extend_schema(
        operation_id="createTruckCapacity",
        summary="Create a new truck capacity",
        tags=["TruckCapacity"],
        responses={201: TruckCapacitySerializer, **ERRORS_WRITE},
    ),
)

truck_capacity_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getTruckCapacity",
        summary="Retrieve a truck capacity",
        tags=["TruckCapacity"],
        responses={
            200: OpenApiResponse(response=TruckCapacitySerializer),
            **ERRORS_DETAIL,
        },
    ),
    patch=extend_schema(
        operation_id="patchTruckCapacity",
        summary="Partially update a truck capacity",
        tags=["TruckCapacity"],
        responses={
            200: OpenApiResponse(response=TruckCapacitySerializer),
            **ERRORS_DETAIL_WRITE,
        },
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruckCapacity",
        summary="Deactivate (soft delete) a truck capacity",
        tags=["TruckCapacity"],
        responses={
            200: OpenApiResponse(response=TruckCapacitySerializer),
            **ERRORS_DETAIL,
        },
    ),
)

truck_type_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listTruckTypes",
        summary="List truck types",
        tags=["TruckType"],
        responses={200: TruckTypeSerializer(many=True), **ERRORS_READ},
    ),
    post=extend_schema(
        operation_id="createTruckType",
        summary="Create a new truck type",
        tags=["TruckType"],
        responses={201: TruckTypeSerializer, **ERRORS_WRITE},
    ),
)

truck_type_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getTruckType",
        summary="Retrieve a truck type",
        tags=["TruckType"],
        responses={200: OpenApiResponse(response=TruckTypeSerializer), **ERRORS_DETAIL},
    ),
    patch=extend_schema(
        operation_id="patchTruckType",
        summary="Partially update a truck type",
        tags=["TruckType"],
        responses={
            200: OpenApiResponse(response=TruckTypeSerializer),
            **ERRORS_DETAIL_WRITE,
        },
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruckType",
        summary="Deactivate (soft delete) a truck type",
        tags=["TruckType"],
        responses={200: OpenApiResponse(response=TruckTypeSerializer), **ERRORS_DETAIL},
    ),
)
