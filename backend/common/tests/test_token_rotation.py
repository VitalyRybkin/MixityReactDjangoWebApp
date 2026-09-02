from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from core.tests.authentication_tests import _suppress_expected_auth_logs
from core.tests.utils import TestLoggerMixin


class TestRefreshTokenRotation(TestLoggerMixin, APITestCase):
    def setUp(self) -> None:
        self.user = get_user_model().objects.create_user(
            username="token_rotation_user",
            password="test_password",
        )

    def test_old_refresh_token_cannot_be_reused_after_rotation(self) -> None:
        self._logger_header("AUTHENTICATION: refresh token rotation")

        login_response = self.client.post(
            "/api/auth/token/",
            {
                "username": "token_rotation_user",
                "password": "test_password",
            },
            format="json",
        )

        self.assertEqual(
            login_response.status_code,
            status.HTTP_200_OK,
            login_response.data,
        )

        refresh_a = login_response.data["refresh"]

        first_refresh_response = self.client.post(
            "/api/auth/token/refresh/",
            {
                "refresh": refresh_a,
            },
            format="json",
        )

        self.assertEqual(
            first_refresh_response.status_code,
            status.HTTP_200_OK,
            first_refresh_response.data,
        )

        self.assertIn(
            "refresh",
            first_refresh_response.data,
            msg="Refresh token rotation is disabled",
        )

        refresh_b = first_refresh_response.data["refresh"]

        self.assertNotEqual(
            refresh_a,
            refresh_b,
            msg="Refresh token was not rotated",
        )

        with _suppress_expected_auth_logs():
            reused_refresh_response = self.client.post(
                "/api/auth/token/refresh/",
                {
                    "refresh": refresh_a,
                },
                format="json",
            )

        self.assertEqual(
            reused_refresh_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
            reused_refresh_response.data,
        )

        second_refresh_response = self.client.post(
            "/api/auth/token/refresh/",
            {
                "refresh": refresh_b,
            },
            format="json",
        )

        self.assertEqual(
            second_refresh_response.status_code,
            status.HTTP_200_OK,
            second_refresh_response.data,
        )

        print(
            f"{self.INDENT}{self.COLOR['ERR']}"
            f"✗ {self.COLOR['END']}{self.COLOR['OK']}Refresh token rotated and old token rejected | HTTP 401"
            f"{self.COLOR['END']}"
        )
