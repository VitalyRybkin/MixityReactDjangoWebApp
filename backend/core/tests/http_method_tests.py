from typing import ClassVar, cast
from unittest import TestCase

from rest_framework import status
from rest_framework.test import APIClient

from core.tests.utils import TestLoggerMixin


class DisallowedMethodsContractMixin:
    disallowed_methods: ClassVar[tuple[str, ...]] = ()

    def _disallowed_methods_logic(self) -> None:
        test_case = cast(TestCase, self)
        client = cast(APIClient, getattr(self, "client"))
        url = cast(str, getattr(self, "url"))
        logger = cast(TestLoggerMixin, self)
        logger._logger_header(f"ENDPOINT: Disallowed methods for {url}")

        for method_name in self.disallowed_methods:
            with test_case.subTest(method=method_name.upper()):
                method = getattr(client, method_name)

                response = method(url)

                test_case.assertEqual(
                    response.status_code,
                    status.HTTP_405_METHOD_NOT_ALLOWED,
                )
                logger._logger_success(method_name.upper(), "HTTP 405")
