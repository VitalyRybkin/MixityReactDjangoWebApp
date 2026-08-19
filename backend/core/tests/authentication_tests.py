from typing import Any

from rest_framework import status


class AuthenticationContractMixin:
    check_authentication = True
    authentication_method = "get"
    authentication_format = "json"

    def _get_authentication_payload(self) -> dict[str, Any]:
        return {}

    def test_unauthenticated_request_returns_401(self) -> None:
        if not self.check_authentication:
            return

        self.client.force_authenticate(user=None)

        method_name = self.authentication_method.lower()
        method = getattr(self.client, method_name)

        kwargs: dict[str, Any] = {}

        if method_name in {
            "post",
            "put",
            "patch",
        }:
            kwargs["data"] = self._get_authentication_payload()
            kwargs["format"] = self.authentication_format

        with self.assertLogs(
            "core.api.exceptions",
            level="WARNING",
        ):
            response = method(
                self.url,
                **kwargs,
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
            response.data,
        )

        print(
            f"    {self.COLOR['OK']}"
            "✓ Access denied without authentication | HTTP 401"
            f"{self.COLOR['END']}"
        )