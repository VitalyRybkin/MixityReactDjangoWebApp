from typing import Any
from unittest import SkipTest

from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from core.tests.utils import TestLoggingMixin, ValidationFieldSpec


class BaseModelTestCase(APITestCase, TestLoggingMixin):

    _model: Any = None
    _factory: Any = None
    invalid_fields_map: list[ValidationFieldSpec] | None = None
    valid_fields_map: list[ValidationFieldSpec] | None = None
    obj: Any
    expected: str

    def setUp(self) -> None:
        super().setUp()

        if self._factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No factory configured.")

        self.obj = self._factory.create()

    def _validate_model_invalid_fields(self) -> None:
        if not self.invalid_fields_map:
            raise SkipTest(f"{self.__class__.__name__}: No fields found for testing.")

        if self._factory is None or self._model is None:
            raise SkipTest(f"{self.__class__.__name__}: No model/factory configured.")

        self._logger_header(f"VALIDATION: Field validation for {self._model.__name__}")

        for field_config in self.invalid_fields_map:
            field = field_config.field_name
            value = (
                field_config.invalid_value()
                if callable(field_config.invalid_value)
                else field_config.invalid_value
            )

            with self.subTest(field=field, value=value):
                obj = self._factory.create()
                setattr(obj, field, value)

                with self.assertRaises(ValidationError) as exc:
                    obj.full_clean()

                self.assertIn(
                    field,
                    exc.exception.message_dict,
                    msg=f"Expected ValidationError on '{field}', got: {exc.exception.message_dict!r}",
                )

                print(
                    f"      {self.COLOR['OK']}"
                    f"✓ {self._model.__name__}.{field} rejected value '{value}'"
                    f"{self.COLOR['END']}"
                )

    def _validate_model_valid_fields(self) -> None:
        if self.valid_fields_map is None:
            raise SkipTest(f"{self.__class__.__name__}: No fields found for testing.")

        if self._factory is None or self._model is None:
            raise SkipTest(f"{self.__class__.__name__}: No model/factory configured.")

        self._logger_header(
            f"VALIDATION: Field valid values for {self._model.__name__}"
        )

        for field_config in self.valid_fields_map:
            field = field_config.field_name
            value = (
                field_config.invalid_value()
                if callable(field_config.invalid_value)
                else field_config.invalid_value
            )

            with self.subTest(field=field, value=value):
                obj = self._factory.create()
                setattr(obj, field, value)

                try:
                    obj.full_clean()
                except ValidationError as exc:
                    self.fail(
                        f"Expected '{field}={value}' to be valid for {self._model.__name__}, "
                        f"but got errors: {exc.message_dict!r}"
                    )

                print(
                    f"      {self.COLOR['OK']}"
                    f"✓ {self._model.__name__}.{field} accepted value '{value}'"
                    f"{self.COLOR['END']}"
                )

    def _str_method(self, expected: str) -> None:
        self._logger_header(f"METHOD: __str__ for {self._model.__name__}")
        self.assertEqual(str(self.obj), str(expected))
        self._logger_success(f"{str(self.obj)!r}", "String matches expected")
