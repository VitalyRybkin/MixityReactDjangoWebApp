import logging
from typing import Any, Optional
from unittest import SkipTest

from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from core.tests.crud_tests import CrudContractMixin
from core.tests.field_matching_tests import FieldContractMixin
from core.tests.model_tests import ModelContractMixin
from core.tests.utils import TestLoggingMixin, UploadSpec
from core.tests.validation_tests import ValidationContractMixin
from core.tests.visibility_tests import (
    ActiveVisibilityContractMixin,
    ReadOnlyActiveFieldContractMixin,
    SoftDeleteContractMixin,
)

logger = logging.getLogger(__name__)


class BaseTestCase(APITestCase):
    """
    BaseTestCase class that extends from APITestCase.

    Serves as a foundation for creating test cases in the
    application. It inherits functionality from the APITestCase, which
    provides tools and utilities to perform API tests effectively, such as
    handling requests, responses, and ensuring proper testing practices.
    """

    pass


class BaseAPITestCase(
    TestLoggingMixin,
    FieldContractMixin,
    CrudContractMixin,
    ValidationContractMixin,
    ModelContractMixin,
    ActiveVisibilityContractMixin,
    SoftDeleteContractMixin,
    ReadOnlyActiveFieldContractMixin,
    BaseTestCase,
):
    """
    BaseAPITestCase class that extends from BaseTestCase.

    Provides a base for API test cases, incorporating various
    mixins for testing fields, CRUD operations, validation, models, and active field updates.
    It ensures proper testing practices and handles requests, responses,
    and model interactions.
    """

    __test__ = False

    model: Any = None
    factory: Any = None
    url_name: Optional[str | None] = None
    pk_url_name: Optional[str | None] = None
    upload_file_spec: UploadSpec | None = None

    def setUp(self) -> None:
        logging.getLogger("django.request").setLevel(logging.ERROR)

        if self.factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No resource found for testing.")

        self.obj = self.factory.create()

        if self.url_name is not None:
            self.url = reverse(self.url_name)
        elif self.pk_url_name is not None:
            self.url = reverse(self.pk_url_name, kwargs={"pk": self.obj.id})
        else:
            raise SkipTest(f"No url configured for '{self.__class__.__name__}'.")

    def get_detail_url(self, pk: Any) -> str:
        name = self.pk_url_name or self.url_name
        if not name:
            raise SkipTest(f"No detail url configured for {self.__class__.__name__}.")
        return reverse(name, kwargs={"pk": pk})


BaseAPIMixin = BaseAPITestCase


class BaseModelTestCase(APITestCase, TestLoggingMixin):
    __test__ = False

    _model: Any = None
    _factory: Any = None

    obj: Any
    expected: str

    def setUp(self) -> None:
        super().setUp()

        if self._factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No factory configured.")

        self.obj = self._factory.create()

    def _str_method(self, expected: str) -> None:
        self._logger_header(f"METHOD: __str__ for {self._model.__name__}")
        self.assertEqual(str(self.obj), str(expected))
        print(
            f"    {self.COLOR['OK']}✓ String matches: {str(self.obj)}{self.COLOR['END']}"
        )
