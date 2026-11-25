"""OpenAPI schemas for the responses produced by the API exception handler."""

from drf_spectacular.utils import OpenApiExample, OpenApiResponse

MESSAGE_LIST = {"type": "array", "items": {"type": "string"}}
ERROR_ENVELOPE_FIELDS = {
    "type": "object",
    "required": ["errors", "messages"],
}
ERROR_ENVELOPE = {
    **ERROR_ENVELOPE_FIELDS,
    "properties": {
        "errors": {
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    {"type": "string"},
                    {"type": "array", "items": {}},
                    {"type": "object", "additionalProperties": {}},
                ],
            },
        },
        "messages": MESSAGE_LIST,
    },
}
DETAIL_ERROR_ENVELOPE = {
    **ERROR_ENVELOPE_FIELDS,
    "properties": {
        "errors": {
            "type": "object",
            "required": ["detail"],
            "properties": {"detail": {"type": "string"}},
        },
        "messages": MESSAGE_LIST,
    },
}

ERROR_400 = OpenApiResponse(
    response=ERROR_ENVELOPE,
    description="Request validation or parsing failed.",
    examples=[
        OpenApiExample(
            "Field validation",
            value={
                "errors": {"name": ["This field is required."]},
                "messages": ["Name: This field is required."],
            },
        ),
        OpenApiExample(
            "Nested validation",
            value={
                "errors": {"items": [{"quantity": ["Enter a positive quantity."]}]},
                "messages": ["Items: Enter a positive quantity."],
            },
        ),
    ],
)

ERROR_401 = OpenApiResponse(
    response={"oneOf": [DETAIL_ERROR_ENVELOPE, MESSAGE_LIST]},
    description="Missing credentials use the error envelope. Invalid or expired credentials return a list of messages.",
    examples=[
        OpenApiExample(
            "Invalid or expired credentials",
            value=["Ошибка аутентификации."],
        ),
    ],
)

ERROR_403 = OpenApiResponse(
    response=DETAIL_ERROR_ENVELOPE,
    description="The authenticated user lacks the required permission.",
)

ERROR_406 = OpenApiResponse(
    response=DETAIL_ERROR_ENVELOPE,
    description="The requested response media type is unavailable.",
)

ERROR_500 = OpenApiResponse(
    response=MESSAGE_LIST,
    description="An unexpected server error occurred.",
    examples=[OpenApiExample("Server error", value=["Внутренняя ошибка сервера."])],
)

ERROR_503 = OpenApiResponse(
    response={"oneOf": [DETAIL_ERROR_ENVELOPE, MESSAGE_LIST]},
    description="A required service is temporarily unavailable.",
    examples=[
        OpenApiExample(
            "Database unavailable", value=["Отсутствует подключение к базе данных."]
        ),
    ],
)

ERROR_404 = OpenApiResponse(
    response=DETAIL_ERROR_ENVELOPE,
    description="The requested resource or page was not found.",
)
ERROR_415 = OpenApiResponse(
    response=DETAIL_ERROR_ENVELOPE,
    description="The request body uses an unsupported media type.",
)

ERRORS_AUTH = {401: ERROR_401, 403: ERROR_403}
ERRORS_READ = {**ERRORS_AUTH, 406: ERROR_406, 500: ERROR_500, 503: ERROR_503}
ERRORS_FILTERED_READ = {400: ERROR_400, **ERRORS_READ}
ERRORS_DETAIL = {**ERRORS_READ, 404: ERROR_404}
ERRORS_FILTERED_DETAIL = {400: ERROR_400, **ERRORS_DETAIL}
ERRORS_WRITE = {**ERRORS_FILTERED_READ, 415: ERROR_415}
ERRORS_DETAIL_WRITE = {**ERRORS_FILTERED_DETAIL, 415: ERROR_415}
