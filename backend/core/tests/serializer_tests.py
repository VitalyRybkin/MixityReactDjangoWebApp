from typing import Any, ClassVar, cast
from unittest import TestCase

from core.tests.base_view_test_case import BaseViewTestCase


class SerializerSelectionContractMixin(BaseViewTestCase):
    """
    Test case for view serializer classes.

    Attributes:
        _view_class: The view class being tested.
        _cases: A list of test cases, each consisting of a method and its
            expected serializer.

    Methods:
        test_serializer_classes:
            Tests the serializer class for each method and its corresponding
            expected serializer.
    """

    __test__ = False
    _cases = []

    def test_serializer_classes(self) -> None:
        for method, serializer in self._cases:
            with self.subTest(method=method):
                self._assert_serializer_class(
                    method=method,
                    expected_serializer=serializer,
                )


class ExcludedSerializerFieldsContractMixin:
    serializer_class: ClassVar[Any]
    excluded_fields: ClassVar[tuple[str, ...]] = ()

    def test_excluded_fields_are_not_exposed(self) -> None:
        test_case = cast(TestCase, self)
        serializer = self.serializer_class()

        for field_name in self.excluded_fields:
            with test_case.subTest(field=field_name):
                test_case.assertNotIn(
                    field_name,
                    serializer.fields,
                )
