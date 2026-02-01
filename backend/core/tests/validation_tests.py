from typing import Dict, Any, TYPE_CHECKING
from unittest import TestCase

from core.tests.utils import coerce_fieldspec

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


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
        Tests the behavior of the API when a specific required field is missing in the input payload.

        Parameters:
        field_name: str
            The name of the field that is missing in the payload and is expected to
            cause a validation error in the API response.
        payload: dict
            The input payload to be sent to the API without the specified field.
        msg: str
            Optional. Custom message for assertion logs in case the validation error
            logic is triggered. Defaults to "required".
        """
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
        self._logger_success(field_name, msg)

    def _test_all_mandatory_fields(self, valid_payload: dict) -> None:
        """
        Tests and validates the presence of all mandatory fields in the given payload.

        Checks that all required fields, as specified in the `fields_map`,
        are present in the provided payload. Ensures that payloads missing mandatory
        fields are handled correctly by simulating a validation error. String fields in
        the payload are modified during testing to prevent unique collisions, if applicable.

        Parameters:
            valid_payload (dict): A dictionary representing the payload to be validated. It must
                include properly formatted values that can be tested for missing mandatory fields.
        Returns:
            None
        """
        import uuid

        self._logger_header("VALIDATION: Mandatory fields", level=1)

        for api_field, raw in self.fields_map.items():
            spec = coerce_fieldspec(raw)
            if not spec.required:
                continue

            with self.subTest(field=api_field):
                current_payload = valid_payload.copy()

                for key, value in current_payload.items():
                    if isinstance(value, str):
                        current_payload[key] = f"{value}_{uuid.uuid4().hex[:4]}"

                self._validation_error_logic(api_field, current_payload, msg="missing field")

    def _test_all_unique_fields(self, valid_payload: dict) -> None:
        """
        Tests that all fields with unique constraints cannot have duplicate values.
        The method validates fields specified in the `fields_map` and ensures
        that duplicate values for these fields result in a 400 status code from
        the API. Checks fields with the uniqueness constraint and logs the
        results for each failed validation.

        Parameters:
        valid_payload: dict
            The payload containing valid data for the test. It is used as a base to
            create a copy with duplicate values for uniqueness validation.

        Raises:
        AssertionError
            If the API does not return a 400 status code for a duplicate field or
            if the expected field is not present in the response data.
        """
        self._logger_header("VALIDATION: Unique constraints", level=1)

        for api_field, raw in self.fields_map.items():
            spec = coerce_fieldspec(raw)
            if not spec.unique:
                continue

            with self.subTest(field=api_field):
                duplicate_payload = valid_payload.copy()
                duplicate_payload[api_field] = getattr(self.obj, spec.model_field)

                response = self.client.post(self.url, data=duplicate_payload)
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
