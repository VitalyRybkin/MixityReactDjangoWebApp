import logging
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional, Union
from unittest import SkipTest

from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

logger = logging.getLogger(__name__)

CastFn = Union[type, Callable[[Any], Any]]


@dataclass(frozen=True, slots=True)
class FieldSpec:
    """
    Describes specifications for a field, including constraints like required, unique, and type casting.

    Defines and manages metadata for fields,
    such as whether a field is required, unique, or should be subjected to type-casting.
    Provides functionality to normalize a provided value based on defined specifications.

    Attributes:
        model_field: The field name as represented in the model.
        cast: A callable function used to cast or transform the value. Optional.
        required: A boolean indicating if the field is mandatory. Defaults to False.
        unique: A boolean indicating if the field must be unique. Defaults to False.

    Methods:
        normalize:
            Converts or transforms the input value using the defined cast function.
    """

    model_field: str
    cast: Optional[CastFn] = None
    required: bool = False
    unique: bool = False

    def normalize(self, value: Any) -> Any:
        if value is None or self.cast is None:
            return value
        return self.cast(value)


class BaseAPIMixin(APITestCase):
    """
    Mixin class to streamline API testing for Django applications.

    This class is designed to facilitate testing of REST API endpoints by
    providing reusable logic for verifying GET and POST requests, handling
    validation errors, and testing field constraints. It includes helpers
    for logging test results with colored output for better readability.

    :ivar model: The Django model associated with the mixin. This must be
        specified in the subclass.
    :ivar factory: A factory instance for creating test objects for the model.
        This must be specified in the subclass.
    :ivar url_name: The reverse URL name of the resource under test.
        This must be specified in the subclass.
    :ivar fields_map: A mapping of API endpoints fields to their corresponding
        model fields and metadata, including type, mandatory status, and whether
        the field is unique.
    :type model: Any
    :type factory: Any
    :type url_name: Optional[str]
    :type fields_map: Dict[str, Any]
    """

    __test__ = False

    model: Any = None
    factory: Any = None
    url_name: Optional[str] = None
    fields_map: Dict[str, FieldSpec] = {}

    COLOR = {
        "HEAD": "\033[1;34m",
        "SUB": "\033[1;36m",
        "OK": "\033[0;32m",
        "ERR": "\033[1;31m",
        "END": "\033[0m",
    }

    def _log_header(self, title: str, level: int = 0) -> None:
        """Print a formatted header with colored text for better readability."""
        indent = "  " * level
        prefix = "➔" if level == 0 else "↳"
        color = self.COLOR["HEAD"] if level == 0 else self.COLOR["SUB"]

        start_nl = "\n" if level == 0 else ""

        print(f"{start_nl}{indent}{color}{prefix} {title}{self.COLOR['END']}")

    def _log_success(self, field_name: str, msg: str) -> None:
        """Log a success message with a green checkmark."""
        print(f"      {self.COLOR['OK']}✓ {field_name:12} | {msg}{self.COLOR['END']}")

    def setUp(self) -> None:
        logging.getLogger("django.request").setLevel(logging.ERROR)

        if self.factory is None or not self.url_name:
            raise SkipTest("No resource found for testing.")

        self.url = reverse(self.url_name)
        self.obj = self.factory.create()

    def _get_list_logic(self) -> None:
        """Verify that GET requests return a list of objects."""
        self._log_header(f"ENDPOINT GET: {self.url_name}")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        for api_f, spec in self.fields_map.items():
            actual = spec.normalize(response.data[0][api_f])
            expected = spec.normalize(getattr(self.obj, spec.model_field))
            self.assertEqual(actual, expected)
        print(
            f"    {self.COLOR['OK']}✓ List verified ({len(self.fields_map)} fields){self.COLOR['END']}"
        )

    def _create_logic(self, payload: Dict[str, Any]) -> None:
        """Create a new object using the provided payload."""
        self._log_header(f"ENDPOINT POST: {self.url_name}")
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, 201)
        print(f"    {self.COLOR['OK']}✓ Object created successfully{self.COLOR['END']}")

    def _validation_error_logic(
        self, field_name: str, payload: dict, msg: str = "required"
    ) -> None:
        """Verify that a validation error is returned for a given field."""
        invalid_payload = payload.copy()
        invalid_payload.pop(field_name, None)

        response = self.client.post(self.url, data=invalid_payload)

        self.assertEqual(
            response.status_code,
            400,
            msg=f"API should return 400 if field '{field_name}' is missing",
        )
        self.assertIn(
            field_name,
            response.data,
            msg=f"Response should contain an error for field '{field_name}'",
        )
        self._log_success(field_name, msg)

    def _test_all_mandatory_fields(self, valid_payload: dict) -> None:
        """Verify that all mandatory fields are present in the payload."""
        import uuid

        self._log_header("VALIDATION: Mandatory fields", level=1)

        for api_field, spec in self.fields_map.items():
            if not spec.required:
                continue

            with self.subTest(field=api_field):
                current_payload = valid_payload.copy()
                for key, value in current_payload.items():
                    if isinstance(value, str):
                        current_payload[key] = f"{value}_{uuid.uuid4().hex[:4]}"

                self._validation_error_logic(
                    api_field, current_payload, msg="missing field"
                )

    def _test_all_unique_fields(self, valid_payload: dict) -> None:
        """Verify that all unique fields are unique."""
        self._log_header("VALIDATION: Unique constraints", level=1)

        for api_field, spec in self.fields_map.items():
            if not spec.unique:
                continue

            with self.subTest(field=api_field):
                duplicate_payload = valid_payload.copy()
                duplicate_payload[api_field] = spec.normalize(
                    getattr(self.obj, spec.model_field)
                )

                response = self.client.post(self.url, data=duplicate_payload)
                self.assertEqual(
                    response.status_code,
                    400,
                    msg=f"API should return 400 on duplicate field '{api_field}'",
                )
                self.assertIn(api_field, response.data)
                self._log_success(api_field, "duplicate")

    def _str_method_logic(self, expected_output: str) -> None:
        """Verify that the __str__ method returns the expected output."""
        self._log_header(f"METHOD: __str__ for {self.model.__name__}")
        self.assertEqual(str(self.obj), expected_output)
        print(
            f"    {self.COLOR['OK']}✓ String matches: {expected_output}{self.COLOR['END']}"
        )
