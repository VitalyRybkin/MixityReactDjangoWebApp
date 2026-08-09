from typing import Any, ClassVar, Protocol, TypeVar
from unittest import SkipTest

from django.db.models import QuerySet
from rest_framework.serializers import BaseSerializer
from rest_framework.test import APIRequestFactory, APITestCase

from core.tests.utils import TestLoggerMixin

SerializerClass = type[BaseSerializer]
ViewClass = TypeVar("ViewClass", bound="SupportsViewContracts")


class SupportsViewContracts(Protocol):
    request: Any
    args: tuple[Any, ...]
    kwargs: dict[str, Any]

    def initialize_request(self, request: Any, *args: Any, **kwargs: Any) -> Any: ...

    def get_queryset(self) -> QuerySet[Any]: ...

    def get_serializer_class(self) -> SerializerClass: ...


class BaseViewTestCase(APITestCase, TestLoggerMixin):
    _view_class: type[SupportsViewContracts] | None = None

    def setUp(self) -> None:
        super().setUp()

        if self._view_class is None:
            raise SkipTest(f"{self.__class__.__name__}: No view class configured.")

    def _get_view_class(self) -> type[SupportsViewContracts]:
        if self._view_class is None:
            raise SkipTest(f"{self.__class__.__name__}: No view class configured.")
        return self._view_class

    def _assert_serializer_class(
        self,
        *,
        method: str,
        expected_serializer: SerializerClass,
        view_class: type[SupportsViewContracts] | None = None,
    ) -> None:
        view_class = view_class or self._get_view_class()

        factory = APIRequestFactory()
        request = getattr(factory, method.lower())("/")

        view = view_class()
        view.request = view.initialize_request(request)

        self.assertEqual(
            view.get_serializer_class(),
            expected_serializer,
        )


class BaseQuerysetTestCase(BaseViewTestCase):
    _factory: ClassVar[Any | None] = None

    def setUp(self) -> None:
        super().setUp()

        if self._factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No factory configured.")

    def _assert_queryset_contract(
        self,
        *,
        expected_prefetches: list[str] | None = None,
        expected_selects: list[str] | None = None,
        ordered: bool = True,
    ) -> None:
        view_class = self._get_view_class()

        self._logger_header(f"METHOD: get_queryset for {view_class.__name__}")

        factory = self._factory

        if factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No factory configured.")

        factory.create()

        factory = APIRequestFactory()
        request = factory.get("/")

        view = view_class()
        view.request = request
        view.args = ()
        view.kwargs = {}

        queryset = view.get_queryset()
        result = list(queryset)

        self.assertTrue(result, "Queryset is empty")

        if ordered:
            ids = [obj.id for obj in result]
            self.assertEqual(ids, sorted(ids), "Queryset is not ordered by id")

        prefetches = getattr(queryset, "_prefetch_related_lookups", ())
        for lookup in expected_prefetches or []:
            self.assertIn(lookup, prefetches, f"Missing prefetch: {lookup}")

        if expected_selects:
            select = queryset.query.select_related

            if select is not True:
                select = select or {}
                for field in expected_selects:
                    self.assertIn(field, select, f"Missing select_related: {field}")

        self._logger_success(view_class.__name__, "✓ Queryset matches expectations")
