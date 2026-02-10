"""
Provides schemas for truck-related API endpoints.
"""

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from core.openapi.errors import (
    ERRORS_DETAIL,
    ERRORS_DETAIL_WRITE,
    ERRORS_READ,
    ERRORS_WRITE,
)
from logistic.serializers.truck_serializers import (
    TruckCapacityReadSerializer,
    TruckCapacityWriteSerializer,
    TruckReadSerializer,
    TruckSerializer,
    TruckTypeSerializer,
)

OpenApiExample(
    "Truck capacity example",
    value={
        "id": 1,
        "capacity": "2.5",
        "description": "",
    },
    response_only=True,
)

truck_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listTrucks",
        summary="List trucks",
        tags=["Truck"],
        responses={200: TruckReadSerializer(many=True), **ERRORS_READ},
        description="""Handles listing `Truck` objects.
        Provides functionality to list all existing `Trucks`.
        """,
    ),
    post=extend_schema(
        operation_id="createTruck",
        summary="Create a new truck",
        tags=["Truck"],
        request=TruckSerializer,
        responses={201: TruckReadSerializer, **ERRORS_WRITE},
        description="""Handles creating a new `Truck` object.
        Provides functionality to create a new `Truck` with specified data.
        """,
    ),
)

truck_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getTruck",
        summary="Retrieve a truck",
        tags=["Truck"],
        responses={200: OpenApiResponse(response=TruckReadSerializer), **ERRORS_DETAIL},
        description="""Handles retrieving a single `Truck` object.
        Provides functionality to retrieve details of a specific `Truck`.
        """,
    ),
    patch=extend_schema(
        operation_id="patchTruck",
        summary="Partially update a truck",
        tags=["Truck"],
        request=TruckSerializer,
        responses={
            200: OpenApiResponse(response=TruckReadSerializer),
            **ERRORS_DETAIL_WRITE,
        },
        description="""Handles partially updating a single `Truck` object.
        Provides functionality to partially update a single `Truck`  by ID.
        """,
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruck",
        summary="Deactivate (soft delete) a truck",
        tags=["Truck"],
        responses={200: OpenApiResponse(response=TruckReadSerializer), **ERRORS_DETAIL},
        description="""Handles deactivating a single `Truck` object.
        Provides functionality to deactivate a single `Truck` by ID.
        """,
    ),
)

truck_capacity_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listTruckCapacities",
        summary="List truck capacities",
        tags=["TruckCapacity"],
        responses={200: TruckCapacityReadSerializer(many=True), **ERRORS_READ},
        description="""Handles listing `TruckCapacity` objects.
        Provides functionality to list all existing `TruckCapacity` objects.
        """,
    ),
    post=extend_schema(
        operation_id="createTruckCapacity",
        summary="Create a new truck capacity",
        tags=["TruckCapacity"],
        responses={201: TruckCapacityWriteSerializer, **ERRORS_WRITE},
        description="""Handles creating a new `TruckCapacity` object.
        Provides functionality to create a new `TruckCapacity` object with specified data.
        """,
    ),
)

truck_capacity_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getTruckCapacity",
        summary="Retrieve a truck capacity",
        tags=["TruckCapacity"],
        responses={
            200: OpenApiResponse(response=TruckCapacityReadSerializer),
            **ERRORS_DETAIL,
        },
        description="""Handles retrieving a single `TruckCapacity` object.
        Provides functionality to retrieve a single `TruckCapacity` object by ID.
        """,
    ),
    patch=extend_schema(
        operation_id="patchTruckCapacity",
        summary="Partially update a truck capacity",
        tags=["TruckCapacity"],
        responses={
            200: OpenApiResponse(response=TruckCapacityWriteSerializer),
            **ERRORS_DETAIL_WRITE,
        },
        description="""Handles partially updating a single `TruckCapacity` object.
        Provides functionality to partially update a single `TruckCapacity` object by ID.
        """,
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruckCapacity",
        summary="Deactivate (soft delete) a truck capacity",
        tags=["TruckCapacity"],
        responses={
            200: OpenApiResponse(response=TruckCapacityWriteSerializer),
            **ERRORS_DETAIL,
        },
        description="""Handles deactivating a single `TruckCapacity` object.
        Provides functionality to deactivate a single `TruckCapacity` object by ID.
        """,
    ),
)

truck_type_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listTruckTypes",
        summary="List truck types",
        tags=["TruckType"],
        responses={200: TruckTypeSerializer(many=True), **ERRORS_READ},
        description="""Handles listing all `TruckType` objects.
        Provides functionality to retrieve a list of all `TruckType` objects.
        """,
    ),
    post=extend_schema(
        operation_id="createTruckType",
        summary="Create a new truck type",
        tags=["TruckType"],
        responses={201: TruckTypeSerializer, **ERRORS_WRITE},
        description="""Handles creating a new `TruckType` object.
        Provides functionality to create a new `TruckType` object with specified data.
        """,
    ),
)

truck_type_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getTruckType",
        summary="Retrieve a truck type",
        tags=["TruckType"],
        responses={200: OpenApiResponse(response=TruckTypeSerializer), **ERRORS_DETAIL},
        description="""Handles retrieving a single `TruckType` object.
        Provides functionality to retrieve a single `TruckType` object by ID.
        """,
    ),
    patch=extend_schema(
        operation_id="patchTruckType",
        summary="Partially update a truck type",
        tags=["TruckType"],
        responses={
            200: OpenApiResponse(response=TruckTypeSerializer),
            **ERRORS_DETAIL_WRITE,
        },
        description="""Handles partially updating a single `TruckType` object.
        Provides functionality to partially update a single `TruckType` object by ID.
        """,
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteTruckType",
        summary="Deactivate (soft delete) a truck type",
        tags=["TruckType"],
        responses={200: OpenApiResponse(response=TruckTypeSerializer), **ERRORS_DETAIL},
        description="""Handles deactivating a single `TruckType` object.
        Provides functionality to deactivate a single `TruckType` object by ID.
        """,
    ),
)
