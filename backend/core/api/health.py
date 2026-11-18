import logging

from django.db import connection
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_GET

logger = logging.getLogger(__name__)


@require_GET
def health_check(request: HttpRequest) -> JsonResponse:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return JsonResponse(
            {
                "status": "ok",
            }
        )

    except Exception:
        logger.exception("Health check failed")

        return JsonResponse(
            {
                "status": "error",
            },
            status=503,
        )