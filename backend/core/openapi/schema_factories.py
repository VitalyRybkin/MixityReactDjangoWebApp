from __future__ import annotations

from typing import Any, Dict, Optional, Type

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from core.openapi import ERRORS_READ, ERRORS_WRITE, ERRORS_DETAIL_WRITE, ERRORS_DETAIL


def list_create_schema(
    *,
    resource: str,
    tags: list[str],
    read_serializer: Any,
    write_serializer: Any,
    errors_read: Dict[int, Any] = ERRORS_READ,
    errors_write: Dict[int, Any] = ERRORS_WRITE,
    list_operation_id: Optional[str] = None,
    create_operation_id: Optional[str] = None,
    list_summary: Optional[str] = None,
    create_summary: Optional[str] = None,
    list_description: Optional[str] = None,
    create_description: Optional[str] = None,
) -> Any:
    """
    Generates a schema for listing and creating resources. The schema supports both
    GET and POST HTTP methods and works for endpoints that manage a collection of
    resources. The function dynamically generates operation IDs, summaries, and
    descriptions for both actions based on the provided resource name.

    :param resource: The name of the resource being managed.
    :param tags: A list of tags for categorizing the endpoint.
    :param read_serializer: Serializer for reading the resource data.
    :param write_serializer: Serializer for writing the resource data.
    :param errors_read: A dictionary containing error responses for the GET method (default: ERRORS_READ).
    :param errors_write: A dictionary containing error responses for the POST method (default: ERRORS_WRITE).
    :param list_operation_id: The operation ID for the GET method (default: generated dynamically).
    :param create_operation_id: The operation ID for the POST method (default: generated dynamically).
    :param list_summary: A brief summary for the GET method endpoint (default: generated dynamically).
    :param create_summary: A brief summary for the POST method endpoint (default: generated dynamically).
    :param list_description: A detailed description for the GET method endpoint (default: generated dynamically).
    :param create_description: A detailed description for the POST method endpoint (default: generated dynamically).
    :return: An extended schema view with GET and POST methods defined.
    """
    list_operation_id = list_operation_id or f"list{resource}s"
    create_operation_id = create_operation_id or f"create{resource}"

    list_summary = list_summary or f"List {resource}s"
    create_summary = create_summary or f"Create a new {resource}"

    list_description = list_description or (
        f"Handles listing `{resource}` objects - list all existing `{resource}s`."
    )
    create_description = create_description or (
        f"Handles creating a new `{resource}` object - create a new `{resource}` with specified data."
    )

    return extend_schema_view(
        get=extend_schema(
            operation_id=list_operation_id,
            summary=list_summary,
            tags=tags,
            responses={200: read_serializer(many=True), **errors_read},
            description=list_description,
        ),
        post=extend_schema(
            operation_id=create_operation_id,
            summary=create_summary,
            tags=tags,
            request=write_serializer,
            responses={201: read_serializer, **errors_write},
            description=create_description,
        ),
    )

def retrieve_update_destroy_schema(
    *,
    resource: str,
    tags: list[str],
    read_serializer: Any = None,
    request_serializer: Any = None,
    errors_detail: Dict[int, Any] = ERRORS_DETAIL,
    errors_detail_write: Dict[int, Any] = ERRORS_DETAIL_WRITE,
    get_operation_id: Optional[str] = None,
    patch_operation_id: Optional[str] = None,
    delete_operation_id: Optional[str] = None,
    get_summary: Optional[str] = None,
    patch_summary: Optional[str] = None,
    delete_summary: Optional[str] = None,
    get_description: Optional[str] = None,
    patch_description: Optional[str] = None,
    delete_description: Optional[str] = None,
) -> Any:
    """
    Generates an extended schema configuration for handling retrieve, update, and delete
    operations on a specific resource. This configuration is used for documenting and defining
    API endpoints with details about operation IDs, summaries, descriptions, tags, and
    serialization logic for request and response types. The method supports customization of
    operation IDs, summaries, and descriptions for each HTTP method.

    :param resource: The name of the resource being documented.
    :param tags: A list of tags to group this resource in the API documentation.
    :param read_serializer: Serializer used for serializing the response data of the "retrieve" operation.
    :param request_serializer: Serializer used for processing the incoming payload for update operations.
    :param errors_detail: A dictionary of possible error responses for read and delete operations.
    :param errors_detail_write: A dictionary of possible error responses for update (patch) operations.
    :param get_operation_id: Custom operation ID for the HTTP "GET" method; auto-generated if not provided.
    :param patch_operation_id: Custom operation ID for the HTTP "PATCH" method; auto-generated if not provided.
    :param delete_operation_id: Custom operation ID for the HTTP "DELETE" method; auto-generated if not provided.
    :param get_summary: Custom summary for the "GET" operation; auto-generated if not provided.
    :param patch_summary: Custom summary for the "PATCH" operation; auto-generated if not provided.
    :param delete_summary: Custom summary for the "DELETE" operation; auto-generated if not provided.
    :param get_description: Custom description for the "GET" operation; auto-generated if not provided.
    :param patch_description: Custom description for the "PATCH" operation; auto-generated if not provided.
    :param delete_description: Custom description for the "DELETE" operation; auto-generated if not provided.
    :return: An object defining the schema for retrieve, update, and delete operations on the resource.
    """

    read_response = OpenApiResponse(response=read_serializer)

    get_operation_id = get_operation_id or f"get{resource}"
    patch_operation_id = patch_operation_id or f"patch{resource}"
    delete_operation_id = delete_operation_id or f"delete{resource}"

    get_summary = get_summary or f"Retrieve a {resource}"
    patch_summary = patch_summary or f"Partially update a {resource}"
    delete_summary = delete_summary or f"Deactivate (soft delete) a {resource}"

    get_description = get_description or (
        f"Handles retrieving a single `{resource}` object - retrieve details of a specific `{resource}`."
    )
    patch_description = patch_description or (
        f"Handles partially updating a single `{resource}` object.- partially update a single `{resource}` by ID."
    )
    delete_description = delete_description or (
        f"Handles deactivating a single `{resource}` object - deactivate (soft delete) a single `{resource}` by ID."
    )


    return extend_schema_view(
        get=extend_schema(
            operation_id=get_operation_id,
            summary=get_summary,
            tags=tags,
            responses={200: read_response, **errors_detail},
            description=get_description,
        ),
        patch=extend_schema(
            operation_id=patch_operation_id,
            summary=patch_summary,
            tags=tags,
            request=request_serializer,
            responses={200: read_response, **errors_detail_write},
            description=patch_description,
        ),
        put=extend_schema(exclude=True),
        delete=extend_schema(
            operation_id=delete_operation_id,
            summary=delete_summary,
            tags=tags,
            responses={200: read_response, **errors_detail},
            description=delete_description,
        ),
    )

def resources_schema(
    *,
    resource: str,
    tags: list[str],
    read_serializer: Any,
    errors_read: Dict[int, Any] = ERRORS_READ,
    get_operation_id: Optional[str] = None,
    get_summary: Optional[str] = None,
    get_description: Optional[str] = None,
) -> Any:

    get_operation_id = get_operation_id or f"list{resource}s"
    get_summary = get_summary or f"List {resource}s"
    get_description = get_description or (
        f"Handles listing `{resource}` resources - list all active `{resource}` resources."
    )

    return extend_schema_view(
        get=extend_schema(
            operation_id=get_operation_id,
            summary=get_summary,
            tags=tags,
            responses={200: read_serializer(many=True), **errors_read},
            description=get_description,
        ),
    )

def update_patch_schema(*, resource: str, tags: list[str], serializer: Any, errors_read: dict[int, object],) -> Any:
    return extend_schema_view(
        patch=extend_schema(
            operation_id=f"{resource}_update",
            summary=f"Update {resource}",
            tags=tags,
            request=serializer,
            responses={200: serializer, **errors_read},
        ),
    )