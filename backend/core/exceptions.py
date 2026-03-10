from django.db import OperationalError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    if isinstance(exc, OperationalError):
        logger.exception("Database operational error", exc_info=exc)
        return Response(
            {"detail": "Отсутствует подключение к базе данных."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    response = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled server error", exc_info=exc)
        return Response(
            {"detail": "Внутренняя ошибка сервера."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    view = context.get("view")
    serializer = None

    if view and hasattr(view, "get_serializer"):
        serializer = view.get_serializer()

    if isinstance(response.data, dict) and serializer:
        errors = []

        for field, messages in response.data.items():
            label = serializer.fields.get(field).label if field in serializer.fields else field

            for msg in messages:
                errors.append(f"{label}: {msg}")

        response.data = {"errors": errors}

    return response