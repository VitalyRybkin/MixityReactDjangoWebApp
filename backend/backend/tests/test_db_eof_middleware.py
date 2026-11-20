"""Verify Django's exception middleware retries only safe database EOFs."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.db.utils import OperationalError
from django.http import HttpResponse
from django.test import Client, SimpleTestCase, override_settings
from django.urls import path

from core.tests.utils import TestLoggerMixin

CALLS = {"count": 0, "failures": 0, "error": "SSL SYSCALL error: EOF detected"}


def simulated_view(request):
    """Fail a configurable number of times before returning HTTP 200."""
    CALLS["count"] += 1
    if CALLS["failures"]:
        CALLS["failures"] -= 1
        raise OperationalError(CALLS["error"])
    return HttpResponse("ok")


urlpatterns = [path("__test__/db-eof/", simulated_view)]


@override_settings(
    ROOT_URLCONF=__name__,
    MIDDLEWARE=["backend.middleware.RetryOnceOnDbEofMiddleware"],
)
class TestDbEofMiddleware(TestLoggerMixin, SimpleTestCase):
    """Exercise the actual Django request/exception lifecycle."""

    def setUp(self) -> None:
        super().setUp()
        CALLS.update(count=0, failures=0, error="SSL SYSCALL error: EOF detected")
        self.db = SimpleNamespace(
            in_atomic_block=False,
            settings_dict={"ATOMIC_REQUESTS": False},
            close=Mock(),
        )
        self.connections_patch = patch(
            "backend.middleware.connections", {"default": self.db}
        )
        self.connections_patch.start()
        self.addCleanup(self.connections_patch.stop)
        self.close_patch = patch("backend.middleware.close_old_connections")
        self.close_patch.start()
        self.addCleanup(self.close_patch.stop)
        self.client = Client(raise_request_exception=False)

    def test_get_retries_after_one_eof(self) -> None:
        self._logger_header("MIDDLEWARE: GET EOF RETRY")
        CALLS["failures"] = 1
        response = self.client.get("/__test__/db-eof/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(CALLS["count"], 2)
        self.db.close.assert_called_once_with()
        self._logger_success("GET", "One safe retry recovers a transient EOF")

    def test_post_does_not_retry(self) -> None:
        self._logger_header("MIDDLEWARE: POST IS NEVER REPLAYED")
        CALLS["failures"] = 1
        response = self.client.post("/__test__/db-eof/")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(CALLS["count"], 1)
        self.db.close.assert_not_called()
        self._logger_success("POST", "No replay of potentially mutating request")

    def test_non_eof_error_does_not_retry(self) -> None:
        self._logger_header("MIDDLEWARE: NON-EOF DB ERROR")
        CALLS.update(failures=1, error="no such table")
        response = self.client.get("/__test__/db-eof/")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(CALLS["count"], 1)
        self._logger_success("GET", "Unrelated errors not retried")

    def test_only_one_retry_attempt(self) -> None:
        self._logger_header("MIDDLEWARE: RETRY AT MOST ONCE")
        CALLS["failures"] = 2
        response = self.client.get("/__test__/db-eof/")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(CALLS["count"], 2)
        self.db.close.assert_called_once_with()
        self._logger_success("GET", "Repeated EOF is not retried indefinitely")

    def test_atomic_context_does_not_retry(self) -> None:
        self._logger_header("MIDDLEWARE: ATOMIC CONTEXT")
        self.db.in_atomic_block = True
        CALLS["failures"] = 1
        response = self.client.get("/__test__/db-eof/")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(CALLS["count"], 1)
        self.db.close.assert_not_called()
        self._logger_success("GET", "Atomic request is not replayed")
