import logging
from contextlib import contextmanager
from typing import Any, Iterator, cast

from rest_framework import status
from rest_framework.test import APIClient

from core.tests.utils import TestLoggerMixin


@contextmanager
def _suppress_expected_auth_logs() -> Iterator[None]:
    logger_names = (
        "core.api.exceptions",
        "django.request",
    )

    loggers = [logging.getLogger(name) for name in logger_names]

    previous_levels = [logger.level for logger in loggers]

    try:
        for logger in loggers:
            logger.setLevel(logging.CRITICAL)

        yield
    finally:
        for logger, level in zip(
            loggers,
            previous_levels,
            strict=True,
        ):
            logger.setLevel(level)


class AuthenticationContractMixin:
    check_authentication = True
    authentication_method = "get"
    authentication_format = "json"

    def _get_authentication_payload(self) -> dict[str, Any]:
        return {}

    def test_unauthenticated_request_returns_401(self) -> None:
        if not self.check_authentication:
            return

        client = cast(
            APIClient,
            getattr(self, "client"),
        )
        url = cast(
            str,
            getattr(self, "url"),
        )
        logger = cast(
            TestLoggerMixin,
            self,
        )

        method_name = self.authentication_method.lower()

        logger._logger_header(f"AUTHENTICATION {method_name.upper()}: {url}")

        client.force_authenticate(user=None)

        method = getattr(client, method_name)

        kwargs: dict[str, Any] = {}

        if method_name in {
            "post",
            "put",
            "patch",
        }:
            kwargs["data"] = self._get_authentication_payload()
            kwargs["format"] = self.authentication_format

        with _suppress_expected_auth_logs():
            response = method(
                url,
                **kwargs,
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.data

        print(
            f"{logger.INDENT}{logger.COLOR['ERR']}"
            f"✗ {logger.COLOR['END']}{logger.COLOR['OK']}Access denied without authentication | HTTP 401"
            f"{logger.COLOR['END']}"
        )
