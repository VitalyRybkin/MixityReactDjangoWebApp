import datetime
from typing import Any
from unittest import SkipTest

from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from catalog.models import PurchasePriceHistory, SalesPriceHistory
from catalog.tests.api.factories import (
    ProductFactory,
    PurchasePriceHistoryFactory,
    SalePriceHistoryFactory,
)
from core.tests.utils import TestLoggerMixin, ValidationFieldSpec
from order.tests.factories import CustomerFactory
from stock.tests.factories import WarehouseFactory


class BaseModelTestCase(APITestCase, TestLoggerMixin):

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
                    f"{self.INDENT}{self.COLOR['OK']}"
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
                    f"{self.INDENT}{self.COLOR['OK']}"
                    f"✓ {self._model.__name__}.{field} accepted value '{value}'"
                    f"{self.COLOR['END']}"
                )

    def _test_price_history(
        self,
        *,
        context_manager_name: str,
        context_price_model: type[PurchasePriceHistory | SalesPriceHistory],
        context_factory: type[WarehouseFactory | CustomerFactory],
        price_factory: type[PurchasePriceHistoryFactory | SalePriceHistoryFactory],
        context_field: str,
        owner_field: str,
    ) -> None:

        self._logger_header(f"MANGER: {context_manager_name}")

        context_model = context_factory.create()
        product = ProductFactory.create()
        manager_method = getattr(context_price_model.objects, context_manager_name)

        empty_qs = manager_method(**{context_field: context_model.id}, product_ids=[])
        self.assertEqual(empty_qs.count(), 0)

        price_factory.create(
            **{owner_field: context_model},
            product=product,
            date=datetime.date.today() - datetime.timedelta(days=1),
        )
        latest_price = price_factory.create(
            **{owner_field: context_model}, product=product, date=datetime.date.today()
        )

        qs = manager_method(
            **{context_field: context_model.id}, product_ids=[product.id]
        )

        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.first().id, latest_price.id)

        self._logger_success(f"{context_manager_name}", "Works correctly")

    def _test_autosaved_value(
        self,
        obj: Any,
        field_name: str,
        autosaved_value: Any,
    ) -> None:
        self._logger_header(f"METHOD: autosaved_value for {self._model.__name__}")
        obj.refresh_from_db()
        self.assertEqual(getattr(obj, field_name), autosaved_value)
        self._logger_success(
            f"{autosaved_value!r}",
            f"Autosaved value matches expected for {self._model.__name__}",
        )

    def _str_method(self, expected: str) -> None:
        self._logger_header(f"METHOD: __str__ for {self._model.__name__}")
        self.assertEqual(str(self.obj), str(expected))
        self._logger_success(f"{str(self.obj)!r}", "String matches expected")
