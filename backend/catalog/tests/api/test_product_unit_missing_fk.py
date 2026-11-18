"""Regression tests for ProductUnit FK validation and existing unit factory."""

from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from catalog.models import ProductUnit
from catalog.tests.api.factories import ProductFactory
from core.tests.utils import TestLoggerMixin


class TestProductUnitMissingUnit(TestLoggerMixin, APITestCase):
    """Validate unset or missing units without throwing descriptor exceptions."""

    def test_full_clean_without_unit_reports_field_error(self) -> None:
        self._logger_header("VALIDATION: PRODUCT UNIT MISSING FK")
        obj = ProductUnit(product=ProductFactory.create(), value=25)
        with self.assertRaises(ValidationError) as exc:
            obj.full_clean()
        self.assertIn("unit", exc.exception.message_dict)
        self._logger_success("unit", "Missing unit rejected as a field error")

    def test_save_with_nonexistent_unit_reports_field_error(self) -> None:
        self._logger_header("VALIDATION: PRODUCT UNIT STALE FK")
        obj = ProductUnit(product=ProductFactory.create(), unit_id=9999999, value=25)
        with self.assertRaises(ValidationError) as exc:
            obj.save()
        self.assertIn("unit", exc.exception.message_dict)
        self._logger_success("unit", "Stale unit rejected as a field error")
