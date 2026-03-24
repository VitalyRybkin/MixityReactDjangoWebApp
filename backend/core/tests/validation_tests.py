from decimal import Decimal
from typing import TYPE_CHECKING, Any, Callable, Dict, List
from uuid import UUID

from django.db import models
from rest_framework.serializers import Serializer

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

    def get_serializer(self) -> Serializer:
        """
        Retrieves the serializer instance defined by the ``serializer_class`` attribute.

        :return: An instance of the serializer defined by the ``serializer_class`` attribute.
        :rtype: Serializer

        :raises AttributeError: If the ``serializer_class`` attribute is missing or not set.
        """
        if hasattr(self, "serializer_class") and self.serializer_class:
            return self.serializer_class()
        raise AttributeError(
            f"Тест {self.__class__.__name__} должен иметь атрибут 'serializer_class' "
            "или переопределять метод 'get_serializer()'"
        )

    def _validation_error_logic(
        self, field_name: str, payload: dict, msg: str = "required"
    ) -> None:
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

        self.assertEqual(response.status_code, 400)

        serializer = self.get_serializer()
        field_obj = serializer.fields.get(field_name)

        search_terms = {field_name.lower()}
        if field_obj:
            if field_obj.label:
                search_terms.add(str(field_obj.label).lower())
            if hasattr(field_obj, "label_name"):  # на всякий случай
                search_terms.add(str(field_obj.label_name).lower())

        error_found = any(
            any(term in error.lower() for term in search_terms)
            for error in response.data
        )

        self.assertTrue(
            error_found,
            msg=f"Field '{field_name}' (labels: {search_terms}) not found in errors: {response.data}",
        )

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

        self._logger_header("VALIDATION: Mandatory fields", level=1)

        for api_field, raw in self.fields_map.items():
            spec = coerce_fieldspec(raw)
            if not spec.required:
                continue

            with self.subTest(field=api_field):
                current_payload = {k: _jsonable(v) for k, v in valid_payload.items()}

                current_payload.pop(api_field, None)
                self._validation_error_logic(
                    api_field, current_payload, msg="missing field"
                )

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

        serializer = self.get_serializer()

        for api_field, raw in self.fields_map.items():
            spec = coerce_fieldspec(raw)
            if not spec.unique:
                continue

            with self.subTest(field=api_field):
                duplicate_payload = {k: _jsonable(v) for k, v in valid_payload.items()}
                duplicate_payload[api_field] = _jsonable(
                    getattr(self.obj, spec.model_field)
                )

                response = self.client.post(
                    self.url, data=duplicate_payload, format="json"
                )

                self.assertEqual(
                    response.status_code,
                    400,
                    msg=f"API should return 400 on duplicate field '{api_field}'",
                )

                label = serializer.fields[api_field].label or api_field

                error_found = (
                    api_field in response.data
                    or "non_field_errors" in response.data
                    or any((api_field in err or label in err) for err in response.data)
                )

                self.assertTrue(
                    error_found,
                    msg=f"Expected '{api_field}' or 'non_field_errors' in response, got: {response.data}",
                )
                self._logger_success(api_field, "Duplicated")

    def _test_field_validation(
        self,
        cases: list[tuple[dict[str, object], int, str | None]],
    ) -> None:
        """
        Tests field validation for a given model using provided test cases.
        """
        self._logger_header(f"VALIDATION: Field validation for {self.model.__name__}")

        for payload, expected_status, expected_error_field in cases:
            field_name, field_value = next(iter(payload.items()))
            with self.subTest(payload=payload):
                self.model.objects.filter(**{field_name: field_value}).delete()
                response = self.client.post(self.url, data=payload, format="json")

                if response.status_code != expected_status:
                    self.fail(
                        f"Expected {expected_status} but got {response.status_code}\n"
                        f"Payload: {payload}\n"
                        f"Errors: {response.data}"
                    )

                if expected_status == 400 and expected_error_field:
                    error_found = any(
                        expected_error_field.lower() in error.lower()
                        for error in response.data
                    )
                    self.assertTrue(
                        error_found,
                        msg=f"Expected error on '{expected_error_field}', got: {response.data}",
                    )

                print(f"    {self.COLOR['SUB']}✓ Payload: {payload}{self.COLOR['END']}")

                if response.status_code == 201:
                    self._logger_success(field_name, f"✓ Created {self.model.__name__}")

                if response.status_code == 400:
                    error_info = ", ".join(response.data)
                    self._logger_error(
                        field_name,
                        f"Validation failed: [{error_info}] - {self.model.__name__} not created.",
                    )

    from typing import Any, Mapping, Sequence

    def _test_nested_field_validation(
        self,
        cases: Sequence[tuple[Mapping[str, Any], int, str | None]],
        nested_field: str,
    ) -> None:
        self._logger_header(
            f"VALIDATION: Nested field validation for {self.model.__name__}"
        )

        for payload, expected_status, expected_error_text in cases:
            with self.subTest(payload=payload):
                response = self.client.post(self.url, data=payload, format="json")

                if response.status_code != expected_status:
                    self.fail(
                        f"Expected {expected_status} but got {response.status_code}\n"
                        f"Payload: {payload}\n"
                        f"Errors: {response.data}"
                    )

                if expected_status == 400 and expected_error_text:
                    errors = [str(error) for error in response.data]
                    error_found = any(
                        expected_error_text.lower() in error.lower() for error in errors
                    )
                    self.assertTrue(
                        error_found,
                        msg=(
                            f"Expected error containing '{expected_error_text}', "
                            f"got: {response.data}"
                        ),
                    )

                self._logger_success(
                    self.model.__name__,
                    f"Expected validation result confirmed for nested field: {nested_field}",
                )

    def _test_unique_fields(
        self,
        payload: Dict[str, Any],
        expected_error: str,
    ) -> None:
        self._logger_header(f"VALIDATION: Unique fields for {self.model.__name__}")
        response = self.client.post(self.url, data=payload, format="json")

        self.assertEqual(response.status_code, 400)

        self.assertTrue(
            any(expected_error in error for error in response.data),
            msg=f"Unexpected errors: {response.data}",
        )
        self._logger_error(
            self.model.__name__, f"Unique fields validation failed: {expected_error}"
        )

    def _test_update_should_preserve_same_values(
        self,
        payload: Dict[str, Any],
        obj: Any,
        db_extractor: Callable[[Any], List[str]],
        payload_extractor: Callable[[Dict[str, Any]], List[str]],
    ) -> None:
        """
        Test that updating an object with the same field values does not raise validation errors.
        """
        self._logger_header(
            f"VALIDATION: Update should allow same field values for {self.model.__name__}"
        )

        url = f"{self.url}{obj.id}/"

        response = self.client.put(url, data=payload, format="json")

        self.assertEqual(response.status_code, 200)

        obj.refresh_from_db()

        db_values = db_extractor(obj)
        payload_values = payload_extractor(payload)

        self.assertCountEqual(db_values, payload_values)

        self._logger_success(
            self.model.__name__,
            "Update with same field values succeeded",
        )

    def _test_update_should_fail_on_repeated_field_value(
        self, payload: Dict[str, Any], obj: Any, expected_error: str
    ) -> None:
        self._logger_header(
            f"VALIDATION: Update should fail on repeated field values for {self.model.__name__}"
        )
        url = f"{self.url}{obj.id}/"

        response = self.client.put(url, data=payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertTrue(
            any(expected_error in str(error) for error in response.data),
            msg=f"Unexpected errors: {response.data}",
        )

        self._logger_error(
            self.model.__name__,
            f"Update with repeated field values failed: {expected_error}",
        )
