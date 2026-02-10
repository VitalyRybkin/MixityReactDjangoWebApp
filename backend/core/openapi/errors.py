from drf_spectacular.utils import OpenApiExample, OpenApiResponse, inline_serializer
from rest_framework import serializers

CoreDetailErrorSerializer = inline_serializer(
    name="CoreDetailError",
    fields={"detail": serializers.CharField()},
)

CoreValidationErrorSerializer = inline_serializer(
    name="CoreValidationError",
    fields={
        "non_field_errors": serializers.ListField(child=serializers.CharField(), required=False),
        "field_errors": serializers.DictField(
            child=serializers.ListField(child=serializers.CharField()),
            required=False,
        ),
    },
)

ERROR_400 = OpenApiResponse(
    response=CoreValidationErrorSerializer,
    description="Validation error",
    examples=[
        OpenApiExample("Field validation", value={"name": ["This field is required."]}),
        OpenApiExample("Multiple fields", value={"name": ["Too short."], "phone": ["Invalid format."]}),
    ],
)

ERROR_401 = OpenApiResponse(
    response=CoreDetailErrorSerializer,
    description="Unauthorized",
    examples=[OpenApiExample("Unauthorized", value={"detail": "Authentication credentials were not provided."})],
)

ERROR_403 = OpenApiResponse(
    response=CoreDetailErrorSerializer,
    description="Forbidden",
    examples=[OpenApiExample("Forbidden", value={"detail": "You do not have permission to perform this action."})],
)

ERROR_404 = OpenApiResponse(
    response=CoreDetailErrorSerializer,
    description="Not found",
    examples=[OpenApiExample("Not found", value={"detail": "Not found."})],
)

ERRORS_AUTH = {401: ERROR_401, 403: ERROR_403}
ERRORS_READ = {**ERRORS_AUTH}
ERRORS_WRITE = {400: ERROR_400, **ERRORS_AUTH}
ERRORS_DETAIL = {**ERRORS_AUTH, 404: ERROR_404}
ERRORS_DETAIL_WRITE = {400: ERROR_400, **ERRORS_DETAIL}
