import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.tests.utils import TestLoggerMixin


@pytest.mark.django_db
class TestAuthThrottling(TestLoggerMixin):
    url_name = "token_obtain_pair"

    def setup_method(self) -> None:
        cache.clear()
        self.client = APIClient()

    def teardown_method(self) -> None:
        cache.clear()

    def test_login_is_throttled_after_five_attempts(self) -> None:
        url = reverse(self.url_name)

        self._logger_header(f"ENDPOINT POST: {url}")

        credentials = {
            "username": "wrong-user",
            "password": "wrong-password",
        }

        for attempt in range(1, 6):
            response = self.client.post(
                url,
                credentials,
                format="json",
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED

            self._logger_success(
                f"attempt {attempt}",
                f"HTTP {response.status_code}",
            )

        response = self.client.post(
            url,
            credentials,
            format="json",
        )

        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

        self._logger_success(
            "throttle",
            f"HTTP {response.status_code}",
        )
