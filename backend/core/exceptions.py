import logging

from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc: Exception, context: dict) -> Response:
    response = exception_handler(exc, context)

    if isinstance(exc, OperationalError):
        logger.exception("Database operational error", exc_info=exc)
        return Response(
            {"detail": "Отсутствует подключение к базе данных."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return response