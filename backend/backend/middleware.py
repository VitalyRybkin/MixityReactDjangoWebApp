"""Conservative one-time retry for EOFs raised inside read-only Django views."""

from typing import Any, Callable

from django.db import DEFAULT_DB_ALIAS, close_old_connections, connections
from django.db.utils import OperationalError
from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin


class RetryOnceOnDbEofMiddleware(MiddlewareMixin):
    """Retry a transient database EOF once only for safe view requests.

    Django converts view exceptions to HTTP 500 *inside* the middleware chain;
    ``__call__`` cannot reliably catch them. ``process_exception`` runs before
    that conversion. Never replay POST/PUT/PATCH/DELETE (possible side effects).
    """

    SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
    EOF_FRAGMENTS = (
        "ssl syscall error",
        "eof detected",
        "server closed the connection unexpectedly",
    )

    def process_view(
        self,
        request: HttpRequest,
        view_func: Callable[..., HttpResponse],
        view_args: tuple[Any, ...],
        view_kwargs: dict[str, Any],
    ) -> None:
        """Save the view callback so an exception hook can retry it once."""
        request._mixity_db_retry_view = (  # type: ignore[attr-defined]
            view_func, view_args, view_kwargs
        )
        return None

    def process_exception(
        self, request: HttpRequest, exception: Exception
    ) -> HttpResponse | None:
        """Retry only a known EOF from an otherwise non-transactional safe view."""
        if not isinstance(exception, OperationalError):
            return None
        if request.method not in self.SAFE_METHODS:
            return None
        if not any(
            fragment in str(exception).lower() for fragment in self.EOF_FRAGMENTS
        ):
            return None
        if getattr(request, "_mixity_db_retry_attempted", False):
            return None
        target = getattr(request, "_mixity_db_retry_view", None)
        if target is None:
            return None

        db = connections[DEFAULT_DB_ALIAS]
        if db.in_atomic_block or db.settings_dict.get("ATOMIC_REQUESTS", False):
            return None

        request._mixity_db_retry_attempted = True  # type: ignore[attr-defined]
        db.close()
        close_old_connections()

        view_func, view_args, view_kwargs = target
        return view_func(request, *view_args, **view_kwargs)
