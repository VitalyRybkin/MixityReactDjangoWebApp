"""
    Provides schemas for error responses in carrier-related API endpoints.
"""
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, inline_serializer
from rest_framework import serializers

# 401/403/404/general "detail" shape used by DRF
DetailErrorSerializer = inline_serializer(
    name="DetailError",
    fields={"detail": serializers.CharField()},
)

# DRF validation errors are typically: {"field": ["msg", ...], ...}
# Keys are dynamic, so we model it as Dict[str, List[str]].
ValidationErrorSerializer = inline_serializer(
    name="ValidationError",
    fields={
        "__all__": serializers.DictField(
            child=serializers.ListField(child=serializers.CharField())
        )
    },
)

ERROR_400 = OpenApiResponse(
    response=ValidationErrorSerializer,
    description="Validation error",
    examples=[
        OpenApiExample("Field validation", value={"name": ["This field is required."]}),
        OpenApiExample(
            "Multiple fields",
            value={"name": ["Too short."], "phone": ["Invalid format."]},
        ),
    ],
)

ERROR_401 = OpenApiResponse(
    response=DetailErrorSerializer,
    description="Unauthorized",
    examples=[
        OpenApiExample(
            "Unauthorized",
            value={"detail": "Authentication credentials were not provided."},
        )
    ],
)

ERROR_403 = OpenApiResponse(
    response=DetailErrorSerializer,
    description="Forbidden",
    examples=[
        OpenApiExample(
            "Forbidden",
            value={"detail": "You do not have permission to perform this action."},
        )
    ],
)

ERROR_404 = OpenApiResponse(
    response=DetailErrorSerializer,
    description="Not found",
    examples=[OpenApiExample("Not found", value={"detail": "Not found."})],
)

# Bundles
ERRORS_AUTH = {401: ERROR_401, 403: ERROR_403}
ERRORS_READ = {**ERRORS_AUTH}
ERRORS_WRITE = {400: ERROR_400, **ERRORS_AUTH}
ERRORS_DETAIL = {**ERRORS_AUTH, 404: ERROR_404}
ERRORS_DETAIL_WRITE = {400: ERROR_400, **ERRORS_DETAIL}
