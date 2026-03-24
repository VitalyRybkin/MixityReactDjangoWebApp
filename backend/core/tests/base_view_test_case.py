from typing import Any, Protocol
from unittest import SkipTest

from django.db.models import QuerySet
from rest_framework.test import APIRequestFactory, APITestCase

from core.tests.utils import TestLoggingMixin


class SupportsGetQueryset(Protocol):
    request: Any
    args: tuple[Any, ...]
    kwargs: dict[str, Any]

    def get_queryset(self) -> QuerySet[Any]: ...


class BaseViewTestCase(APITestCase, TestLoggingMixin):
    _factory: Any = None
    _view_class: type[SupportsGetQueryset] | None = None

    def setUp(self) -> None:
        super().setUp()

        if self._factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No factory configured.")

        if self._view_class is None:
            raise SkipTest(f"{self.__class__.__name__}: No view class configured.")

    def _get_view_class(self) -> type[SupportsGetQueryset]:
        if self._view_class is None:
            raise SkipTest(f"{self.__class__.__name__}: No view class configured.")
        return self._view_class

    def _assert_queryset_contract(
        self,
        *,
        expected_prefetches: list[str] | None = None,
        expected_selects: list[str] | None = None,
        ordered: bool = True,
    ) -> None:
        view_class = self._get_view_class()

        self._logger_header(f"METHOD: get_queryset for {view_class.__name__}")

        factory = APIRequestFactory()
        request = factory.get("/")

        view = view_class()
        view.request = request
        view.args = ()
        view.kwargs = {}

        queryset = view.get_queryset()
        result = list(queryset)

        assert result, "Queryset is empty"

        if ordered:
            ids = [obj.id for obj in result]
            assert ids == sorted(ids), "Queryset is not ordered by id"

        prefetches = getattr(queryset, "_prefetch_related_lookups", ())
        for lookup in expected_prefetches or []:
            assert lookup in prefetches, f"Missing prefetch: {lookup}"

        if expected_selects:
            select = queryset.query.select_related

            if select is True:
                pass
            else:
                select = select or {}
                for field in expected_selects:
                    assert field in select, f"Missing select_related: {field}"

        self._logger_success(view_class.__name__, "✓ Queryset matches expectations")
