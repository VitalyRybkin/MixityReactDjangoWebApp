from __future__ import annotations

from typing import Any, Optional, Protocol, ContextManager


class TestLoggerProto(Protocol):
    """
    Protocol to define the structure and required methods for a test logger.

    Outlines the necessary attributes and methods that a
    test logger class must implement. It specifies the required format
    for a logger, including stylistic elements and success message handling.

    Attributes:
        COLOR (dict[str, str]): A mapping of log levels to their respective colors.
    """
    COLOR: dict[str, str]

    def _logger_header(self, title: str, level: int = 0) -> None: ...
    def _logger_success(self, field_name: str, msg: str) -> None: ...


class ApiRuntimeProto(Protocol):
    """
    Protocol for defining the runtime attributes and methods required by API tests.

    Attributes:
        url (Optional[str]): The URL for the API endpoint.
        url_name (Optional[str]): The name of the URL pattern for the API endpoint.
        obj (Any): The object being tested.
        model (Any): The model associated with the object being tested.
        client (Any): The API client for making requests.
    """
    url: Optional[str]
    url_name: Optional[str]
    detail_url_name: Optional[str]
    obj: Any
    model: Any

    client: Any

    def assertEqual(self, first: Any, second: Any, msg: str | None = None) -> None: ...
    def assertTrue(self, expr: Any, msg: str | None = None) -> None: ...
    def assertIn(self, member: Any, container: Any, msg: str | None = None) -> None: ...

    def subTest(self, msg: object | None = ..., **params: Any) -> ContextManager[None]: ...


class BaseMixinProto(TestLoggerProto, ApiRuntimeProto, Protocol):
    """
    Defines a protocol for BaseMixinProto class.

    Serves as a prototype combining functionalities from TestLoggerProto,
    ApiRuntimeProto, and Protocol classes, designed to be used as a base template
    for other mixin implementations. It inherits required features and acts as a
    unifier for utilizing combined behaviors of its parent classes.
    """
    pass
