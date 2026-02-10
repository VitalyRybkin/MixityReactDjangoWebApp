"""
Provides schemas for carrier-related API endpoints.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view

from core.openapi.errors import (
    ERRORS_DETAIL,
    ERRORS_DETAIL_WRITE,
    ERRORS_READ,
    ERRORS_WRITE,
)
from logistic.serializers.carrier_serializers import (
    CarrierResourcesSerializer,
    CarrierSerializer,
)

carrier_list_create_schema = extend_schema_view(
    get=extend_schema(
        operation_id="listCarriers",
        summary="List carriers",
        tags=["Carrier"],
        responses={200: CarrierSerializer(many=True), **ERRORS_READ},
        description="""Handles listing `Carrier` objects.
        Provides functionality to list all active `Carrier` objects.
        """,
    ),
    post=extend_schema(
        operation_id="createCarrier",
        summary="Create a new carrier",
        tags=["Carrier"],
        responses={201: CarrierSerializer, **ERRORS_WRITE},
        description="""Handles creating a new `Carrier` object.
        Provides functionality to create a new `Carrier` object with specified data.
        """,
    ),
)

carrier_resources_schema = extend_schema_view(
    get=extend_schema(
        operation_id="resourcesCarriers",
        summary="List carriers resources",
        tags=["Carrier"],
        responses={
            200: CarrierResourcesSerializer,
            **ERRORS_READ,
        },
        description="""Handles listing `Carrier` resources.
        Provides functionality to list all active `Carrier` resources.
        """,
    ),
)

carrier_retrieve_update_destroy_schema = extend_schema_view(
    get=extend_schema(
        operation_id="getCarrier",
        summary="Retrieve a carrier",
        tags=["Carrier"],
        responses={200: OpenApiResponse(response=CarrierSerializer), **ERRORS_DETAIL},
        description="""Handles retrieving a single `Carrier` object.
        Provides functionality to retrieve a single `Carrier` object by ID.
        Returns a `CarrierSerializer` instance representing the requested `Carrier` object.
        """,
    ),
    patch=extend_schema(
        operation_id="patchCarrier",
        summary="Partially update a carrier",
        tags=["Carrier"],
        responses={
            200: OpenApiResponse(response=CarrierSerializer),
            **ERRORS_DETAIL_WRITE,
        },
        description="""Handles partially updating a single `Carrier` object.
        Provides functionality to partially update a single `Carrier` object by ID.
        """,
    ),
    put=extend_schema(exclude=True),
    delete=extend_schema(
        operation_id="deleteCarrier",
        summary="Deactivate (soft delete) a carrier",
        tags=["Carrier"],
        responses={200: OpenApiResponse(response=CarrierSerializer), **ERRORS_DETAIL},
        description="""Handles deactivating (soft deleting) a single `Carrier` object.
        Provides functionality to deactivate a single `Carrier` object by ID.
        """,
    ),
)
