from typing import Any

import pytest
from django.urls import reverse

from core.tests.utils import TestLoggerMixin


@pytest.mark.django_db
class TestHealthCheck(TestLoggerMixin):
    def test_health_check(self, client: Any) -> None:
        self._logger_header("TEST DB - health check")
        response = client.get(reverse("health-check"))

        assert response.status_code == 200
        assert response.json() == {
            "status": "ok",
            "database": "ok",
        }

        print(
            f"    {self.COLOR['OK']}"
            "✓ Health check is OK | HTTP 200 | Database OK"
            f"{self.COLOR['END']}"
        )