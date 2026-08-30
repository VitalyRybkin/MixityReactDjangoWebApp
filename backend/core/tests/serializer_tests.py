from typing import Any, ClassVar, cast
from unittest import TestCase

from core.tests.base_view_test_case import BaseViewTestCase


class SerializerSelectionContractMixin:
    """
    Test case for view serializer classes.

    Attributes:
        _cases: A list of test cases, each consisting of a method and its
            expected serializer.

    Methods:
        _serializer_classes_logic:
            Tests the serializer class for each method and its corresponding
            expected serializer.
    """

    __test__ = False
    _cases: ClassVar[list[tuple[str, Any]]] = []

    def _serializer_classes_logic(self) -> None:
        """
        Tests the serializer class for each method and its corresponding
        expected serializer.
        """
        test_case = cast(BaseViewTestCase, self)

        for method, serializer in self._cases:
            with test_case.subTest(method=method):
                test_case._assert_serializer_class(
                    method=method,
                    expected_serializer=serializer,
                )


class ExcludedSerializerFieldsContractMixin:
    """
    Mixin class that provides functionality to validate excluded serializer fields.

    Attributes:
        serializer_class (ClassVar[Any]): The serializer class to be tested.
        excluded_fields (ClassVar[tuple[str, ...]]): A tuple containing field names that
            should not be present in the serializer's fields.
    """

    serializer_class: ClassVar[Any]
    excluded_fields: ClassVar[tuple[str, ...]] = ()

    def _excluded_fields_are_not_exposed_logic(self) -> None:
        """
        Tests that the excluded fields are not present in the serializer's fields.
        """
        test_case = cast(TestCase, self)
        serializer = self.serializer_class()

        for field_name in self.excluded_fields:
            with test_case.subTest(field=field_name):
                test_case.assertNotIn(
                    field_name,
                    serializer.fields,
                )
