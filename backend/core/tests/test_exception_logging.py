from unittest.mock import patch

from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken

from core.api.exceptions import custom_exception_handler
from core.tests.utils import TestLoggerMixin


class TestAuthenticationExceptionLogging(TestLoggerMixin):
    """
    Tests that expired JWTs are not logged as warnings.
    """

    def test_expired_jwt_is_not_logged_as_warning(self) -> None:
        """
        Tests that expired JWTs are not logged as warnings.
        """
        self._logger_header("LOGGING: expired JWT does not produce warning")

        exc = InvalidToken(
            {
                "detail": "Given token not valid for any token type",
                "messages": [
                    {
                        "token_class": "AccessToken",
                        "token_type": "access",
                        "message": "Token is expired",
                    }
                ],
            }
        )

        with (
            patch("core.api.exceptions.logger.debug") as debug_mock,
            patch("core.api.exceptions.logger.warning") as warning_mock,
        ):
            response = custom_exception_handler(exc, {})

        assert response.status_code == 401

        debug_mock.assert_called_once_with("JWT token expired")
        warning_mock.assert_not_called()

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Expired JWT logged as DEBUG, not WARNING | HTTP 401"
            f"{self.COLOR['END']}"
        )

    def test_authentication_failure_is_logged_as_warning(self) -> None:
        """
        Tests that authentication failures are logged as warnings.
        """
        self._logger_header("LOGGING: authentication failure produces warning")

        exc = AuthenticationFailed("Invalid credentials")

        with (
            patch("core.api.exceptions.logger.debug") as debug_mock,
            patch("core.api.exceptions.logger.warning") as warning_mock,
        ):
            response = custom_exception_handler(exc, {})

        assert response.status_code == 401

        warning_mock.assert_called_once_with(
            "Authentication failed: %r",
            exc,
        )
        debug_mock.assert_not_called()

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Authentication failure logged as WARNING | HTTP 401"
            f"{self.COLOR['END']}"
        )
