import logging
import re
from typing import Any

from django.db import OperationalError
from rest_framework import exceptions, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.serializers import Serializer
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def _get_response_log_level(status_code: int) -> int:
    if status_code >= 500:
        return logging.ERROR

    if status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_429_TOO_MANY_REQUESTS,
    ):
        return logging.WARNING

    return logging.DEBUG


def _normalize_error_key(value: str) -> str:
    """
    Normalize the error key by removing underscores and converting to lowercase.
    """
    return value.replace("_", "").lower()


def _response_has_error_field(response_data: Any, search_terms: set[str] | str) -> bool:
    """
    Check if the response data contains any error fields matching the search terms.
    """
    normalized_terms = {_normalize_error_key(term) for term in search_terms}

    def matches(value: Any) -> bool:
        normalized_value = _normalize_error_key(str(value))
        return any(term in normalized_value for term in normalized_terms)

    if isinstance(response_data, dict):
        errors = response_data.get("errors")

        if isinstance(errors, dict):
            return any(matches(field) for field in errors.keys())

        if any(matches(field) for field in response_data.keys()):
            return True

        messages = response_data.get("messages")

        if isinstance(messages, list):
            return any(matches(message) for message in messages)

        return matches(response_data)

    if isinstance(response_data, list):
        return any(matches(error) for error in response_data)

    return matches(response_data)

def _extract_error_messages(response_data: Any) -> list[str]:
    """
    Extract error messages from the response data.
    """
    if isinstance(response_data, dict):
        messages = response_data.get("messages")

        if isinstance(messages, list):
            return [str(message) for message in messages]

        errors = response_data.get("errors")

        if isinstance(errors, dict):
            result = []
            for field, value in errors.items():
                if isinstance(value, list):
                    result.extend(f"{field}: {item}" for item in value)
                else:
                    result.append(f"{field}: {value}")
            return result

        result = []
        for field, value in response_data.items():
            if isinstance(value, list):
                result.extend(f"{field}: {item}" for item in value)
            else:
                result.append(f"{field}: {value}")
        return result

    if isinstance(response_data, list):
        return [str(item) for item in response_data]

    return [str(response_data)]

def _format_field_errors(data:dict, serializer: Serializer | None=None) -> list[str]:
    """
    Format field errors from the response data.

    Args:
        data (dict): The response data containing field errors.
        serializer (Serializer | None, optional): The serializer instance for field labels. Defaults to None.

    Returns:
        list: Formatted field error messages.
    """
    formatted: list[str] = []
    for field, value in data.items():
        messages = _extract_messages(value)
        if not messages:
            continue

        message = _clean_message(messages[0])
        if field == "non_field_errors":
            formatted.append(message)
            continue

        label = field
        if serializer and field in serializer.fields:
            label = serializer.fields[field].label or field

        formatted.append(f"{label}: {message}")

    return formatted


def _extract_messages(data: dict | list | str) -> list[str]:
    """
    Extract messages from the response data.
    """
    messages: list[str] = []

    if isinstance(data, list):
        for item in data:
            messages.extend(_extract_messages(item))
        return messages

    if isinstance(data, dict):
        for value in data.values():
            messages.extend(_extract_messages(value))
        return messages

    if data:
        messages.append(str(data))

    return messages


def _clean_message(message: str) -> str:
    """
    Clean and format the error message by removing leading numbers and colons.
    """
    message = str(message).strip()
    message = re.sub(r"^\d+:\s*", "", message)
    return message


def custom_exception_handler(exc: Exception, context: Any) -> Response:
    """
    Custom exception handler for API responses.
    """
    # logger.error("CUSTOM EXCEPTION HANDLER CALLED")

    if isinstance(exc, OperationalError):
        logger.exception("Database operational error")
        return Response(
            ["Отсутствует подключение к базе данных."],
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    response: Response | None = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled server error", exc_info=exc)
        return Response(
            ["Внутренняя ошибка сервера."],
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, AuthenticationFailed):
        logger.warning("Authentication failed: %r", exc)
        return Response(
            ["Ошибка аутентификации."],
            status=status.HTTP_401_UNAUTHORIZED,
        )

    log_level = _get_response_log_level(response.status_code)

    logger.log(
        log_level,
        "RAW RESPONSE DATA BEFORE FORMAT: %r",
        response.data,
    )

    if isinstance(response.data, dict):
        view = context.get("view")
        serializer: Serializer | None = view.get_serializer() if (view and hasattr(view, "get_serializer")) else None
        response.data = {
            "errors": response.data,
            "messages": _format_field_errors(response.data, serializer),
        }

    elif isinstance(response.data, list):
        response.data = [_clean_message(item) for item in response.data]

    elif isinstance(response.data, str):
        response.data = [_clean_message(response.data)]

    logger.log(
        log_level,
        "RAW RESPONSE DATA AFTER FORMAT: %r",
        response.data,
    )
    return response

class AntivirusUnavailableError(exceptions.APIException):
    status_code = 503
    default_detail = "Антивирусная проверка временно недоступна."
    default_code = "antivirus_unavailable"
