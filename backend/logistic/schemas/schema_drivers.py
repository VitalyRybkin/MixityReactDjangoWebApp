from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view

from logistic.schemas.schema_errors import (
    ERRORS_DETAIL,
    ERRORS_DETAIL_WRITE,
    ERRORS_READ,
    ERRORS_WRITE,
)
from logistic.serializers.driver_serializers import DriverSerializer

driver_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listDrivers",
        summary="List drivers",
        tags=["Driver"],
        responses={200: DriverSerializer(many=True), **ERRORS_READ},
        description="""Handles listing `Driver` objects.
        Provides functionality to list all existing `Driver` objects.
        """,
    ),
    post=extend_schema(
        operation_id="createDriver",
        summary="Create a new driver",
        tags=["Driver"],
        responses={201: DriverSerializer, **ERRORS_WRITE},
        description="""Handles creating `Driver` objects.
        Provides functionality to create new `Driver` object.
        """,
    ),
)

driver_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getDriver",
        summary="Retrieve a driver",
        tags=["Driver"],
        responses={200: OpenApiResponse(response=DriverSerializer), **ERRORS_DETAIL},
        description="""Handles retrieving a single `Driver` object.
        Provides functionality to retrieve a single `Driver` object by ID.
        """,
    ),
    patch=extend_schema(
        operation_id="patchDriver",
        summary="Partially update a driver",
        tags=["Driver"],
        responses={
            200: OpenApiResponse(response=DriverSerializer),
            **ERRORS_DETAIL_WRITE,
        },
        description="""Handles partially updating a single `Driver` object.
        Provides functionality to partially update a single `Driver` object by ID.
        """,
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteDriver",
        summary="Deactivate (soft delete) a driver",
        tags=["Driver"],
        responses={200: OpenApiResponse(response=DriverSerializer), **ERRORS_DETAIL},
        description="""Handles deleting a single `Driver` object.
        Provides functionality to delete a single `Driver` object by ID.
        """,
    ),
)
