from decimal import Decimal
from typing import Dict, Any
from typing import TYPE_CHECKING
from uuid import UUID

from django.db import models

from core.tests.utils import coerce_fieldspec

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object

def _jsonable(value: Any) -> Any:
    if isinstance(value, models.Model):
        return value.pk
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    return value

class ValidationContractMixin(_Base):
    """
    Provides a mixin to validate API contracts regarding mandatory fields and unique constraints.

    Extends BaseAssertMixin and provides utilities to verify API response behavior for required and
    unique fields specified in a field map. This mixin's aim is to streamline validation testing
    by automating common checks, such as assessing the API's response when required fields are missing or
    when unique constraints are violated.

    Attributes:
        fields_map: A dictionary mapping field names to their specifications, defining validation
                    requirements such as whether a field is required or unique.
    """
    fields_map: Dict[str, Any] = {}

    def _validation_error_logic(self, field_name: str, payload: dict, msg: str = "required") -> None:
        """
        Handles and verifies the logic of field validation errors in API payloads. This helper
        method ensures that a specific field's absence results in the expected error response
        and logs the outcome.

        Arguments:
        field_name: str
            The name of the field to validate.
        payload: dict
            The payload containing key-value pairs to be sent to the API.
        msg: str, optional
            The error message to be logged or tested against. Defaults to "required".
        """
        invalid_payload = {k: _jsonable(v) for k, v in payload.items()}
        invalid_payload.pop(field_name, None)

        response = self.client.post(self.url, data=invalid_payload, format="json")

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
        self._logger_success(field_name, msg)

    def _test_all_mandatory_fields(self, valid_payload: dict) -> None:
        """
        Iterates over all fields marked as required in the field mapping,
        removing the required fields one by one from the payload to ensure that the
        appropriate validation errors are raised if a required field is missing.

        Parameters
        ----------
        valid_payload : dict
            A dictionary containing the initial valid payload to be used for testing.

        Returns
        -------
        None
        """
        import uuid

        self._logger_header("VALIDATION: Mandatory fields", level=1)

        for api_field, raw in self.fields_map.items():
            spec = coerce_fieldspec(raw)
            if not spec.required:
                continue

            with self.subTest(field=api_field):
                current_payload = {k: _jsonable(v) for k, v in valid_payload.items()}

                for key, value in list(current_payload.items()):
                    if isinstance(value, str):
                        current_payload[key] = f"{value}_{uuid.uuid4().hex[:4]}"

                self._validation_error_logic(api_field, current_payload, msg="missing field")

    def _test_all_unique_fields(self, valid_payload: dict) -> None:
        """
        Validates that all fields marked as unique in the given payload comply with unique constraints
        by simulating the creation of a duplicate resource in the API.

        Parameters:
            valid_payload (dict): A valid dictionary payload containing data to test for uniqueness.

        Raises:
            AssertionError: If the API does not return a 400 status code for duplicate fields or
            the expected error fields are not present in the response.
        """
        self._logger_header("VALIDATION: Unique constraints", level=1)

        for api_field, raw in self.fields_map.items():
            spec = coerce_fieldspec(raw)
            if not spec.unique:
                continue

            with self.subTest(field=api_field):
                duplicate_payload = {k: _jsonable(v) for k, v in valid_payload.items()}
                duplicate_payload[api_field] = _jsonable(getattr(self.obj, spec.model_field))

                response = self.client.post(self.url, data=duplicate_payload, format="json")

                self.assertEqual(
                    response.status_code,
                    400,
                    msg=f"API should return 400 on duplicate field '{api_field}'",
                )
                self.assertTrue(
                    api_field in response.data or "non_field_errors" in response.data,
                    msg=f"Expected '{api_field}' or 'non_field_errors' in response, got: {response.data}",
                )
                self._logger_success(api_field, "duplicate")
