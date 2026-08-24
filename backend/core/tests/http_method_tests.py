from typing import ClassVar, cast
from unittest import TestCase

from rest_framework import status
from rest_framework.test import APIClient


class DisallowedMethodsContractMixin:
    disallowed_methods: ClassVar[tuple[str, ...]] = ()

    def test_disallowed_methods_return_405(self) -> None:
        test_case = cast(TestCase, self)
        client = cast(APIClient, getattr(self, "client"))
        url = cast(str, getattr(self, "url"))

        for method_name in self.disallowed_methods:
            with test_case.subTest(method=method_name.upper()):
                method = getattr(client, method_name)

                response = method(url)

                test_case.assertEqual(
                    response.status_code,
                    status.HTTP_405_METHOD_NOT_ALLOWED,
                )
