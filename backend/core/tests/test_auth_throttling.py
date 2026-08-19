import logging

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

    def test_login_is_throttled_after_five_attempts(
            self,
            caplog,
    ) -> None:
        self._logger_header("ENDPOINT POST: /api/auth/token/")

        caplog.set_level(
            logging.CRITICAL,
            logger="core.api.exceptions",
        )
        caplog.set_level(
            logging.CRITICAL,
            logger="django.request",
        )

        url = reverse(self.url_name)

        payload = {
            "username": "wrong_user",
            "password": "wrong_password",
        }

        for attempt in range(1, 6):
            response = self.client.post(
                url,
                payload,
                format="json",
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED

            print(
                f"    {self.COLOR['OK']}"
                f"✓ attempt {attempt} | HTTP 401"
                f"{self.COLOR['END']}"
            )

        response = self.client.post(
            url,
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

        print(
            f"    {self.COLOR['OK']}"
            "✓ throttle | HTTP 429"
            f"{self.COLOR['END']}"
        )