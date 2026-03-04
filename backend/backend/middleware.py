from typing import Callable

from django.db import close_old_connections
from django.db.utils import OperationalError
from django.http import HttpRequest, HttpResponse


class RetryOnceOnDbEofMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        try:
            return self.get_response(request)
        except OperationalError as e:
            msg = str(e).lower()
            if "ssl syscall error" in msg or "eof detected" in msg:
                close_old_connections()
                return self.get_response(request)
            raise