import logging
import re

from django.db import OperationalError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def _extract_messages(data):
    messages = []

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


def _clean_message(message):
    message = str(message).strip()
    message = re.sub(r"^\d+:\s*", "", message)
    return message


def custom_exception_handler(exc, context):
    logger.error("CUSTOM EXCEPTION HANDLER CALLED")

    if isinstance(exc, OperationalError):
        logger.exception("Database operational error")
        return Response(
            ["Отсутствует подключение к базе данных."],
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    response = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled server error", exc_info=exc)
        return Response(
            ["Внутренняя ошибка сервера."],
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    logger.error("RAW RESPONSE DATA BEFORE FORMAT: %r", response.data)

    if isinstance(response.data, dict):
        view = context.get("view")
        serializer = view.get_serializer() if (view and hasattr(view, "get_serializer")) else None

        formatted = []

        for field, value in response.data.items():
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

        response.data = formatted

    elif isinstance(response.data, list):
        response.data = [_clean_message(item) for item in response.data]

    elif isinstance(response.data, str):
        response.data = [_clean_message(response.data)]

    logger.error("RAW RESPONSE DATA AFTER FORMAT: %r", response.data)
    return response