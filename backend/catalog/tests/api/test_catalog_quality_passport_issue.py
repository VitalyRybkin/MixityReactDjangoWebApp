"""Isolated catalog issuance contracts for the serializer, service and API."""

from datetime import timedelta
from decimal import Decimal
from types import SimpleNamespace
from typing import Any, cast
from unittest.mock import Mock, patch

from django.core.exceptions import ValidationError as DjangoValidationError
from django.urls import reverse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from catalog.api.routes import QualityPassportRoutes
from catalog.api.serializers.passport_serializers import (
    CatalogQualityPassportIssueSerializer,
    QualityPassportIssueSerializer,
)
from catalog.api.views.quality_passports import QualityPassportIssueAPIView
from catalog.services.quality_passport_issue import (
    PassportChanged,
    QualityPassportIssueService,
)
from core.tests.utils import TestLoggerMixin


class CatalogPassportIssueSerializerTests(APITestCase, TestLoggerMixin):
    """Verify catalog passport issue serializer tests contracts."""

    def setUp(self) -> None:
        """Create fixtures for each test."""
        self.today = timezone.localdate()
        self.data = {
            "product_id": 12,
            "expected_latest_passport_id": 25,
            "number": 54673,
            "batch_number": "29.000",
            "issue_date": self.today.isoformat(),
            "production_date": self.today.isoformat(),
            "quantity": "1.000",
        }

    def test_catalog_requires_product_id(self) -> None:
        """Verify catalog requires product id."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE SERIALIZER TESTS: CATALOG REQUIRES PRODUCT ID"
        )
        data = {k: v for k, v in self.data.items() if k != "product_id"}
        serializer = CatalogQualityPassportIssueSerializer(
            data=data, context={"issuance_source": "catalog"}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("product_id", serializer.errors)
        self._logger_success(
            "catalog_requires_product_id", "Verify catalog requires product id"
        )

    def test_numeric_number_input_and_fixed_scale_output(self) -> None:
        for batch_number, expected in [
            (28.34, "28.340"),
            ("29", "29.000"),
            (0, "0.000"),
        ]:
            with self.subTest(batch_number=batch_number):
                serializer = QualityPassportIssueSerializer(
                    data=self.data | {"number": "54673", "batch_number": batch_number}
                )
                self.assertTrue(serializer.is_valid(), serializer.errors)
                self.assertEqual(
                    serializer.validated_data["batch_number"], Decimal(expected)
                )
                self.assertEqual(serializer.data["number"], 54673)
                self.assertEqual(serializer.data["batch_number"], expected)

    def test_rejects_invalid_passport_and_batch_numbers(self) -> None:
        cases: dict[str, list[int | float | str]] = {
            "number": [0, -1, 1.5, 2_147_483_648],
            "batch_number": ["-0.001", "28.3456", "1000000", "NaN"],
        }
        for field, values in cases.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    serializer = QualityPassportIssueSerializer(
                        data=self.data | {field: value}
                    )
                    self.assertFalse(serializer.is_valid())
                    self.assertIn(field, serializer.errors)

    def test_catalog_requires_issue_date(self) -> None:
        """Verify catalog requires issue date."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE SERIALIZER TESTS: CATALOG REQUIRES ISSUE DATE"
        )
        data = {k: v for k, v in self.data.items() if k != "issue_date"}
        serializer = CatalogQualityPassportIssueSerializer(
            data=data, context={"issuance_source": "catalog"}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("issue_date", serializer.errors)
        self._logger_success(
            "catalog_requires_issue_date", "Verify catalog requires issue date"
        )

    def test_catalog_rejects_future_issue_date(self) -> None:
        """Verify catalog rejects future issue date."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE SERIALIZER TESTS: CATALOG REJECTS FUTURE ISSUE DATE"
        )
        data = dict(self.data, issue_date=(self.today + timedelta(days=1)).isoformat())
        serializer = CatalogQualityPassportIssueSerializer(
            data=data, context={"issuance_source": "catalog"}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("issue_date", serializer.errors)
        self._logger_success(
            "catalog_rejects_future_issue_date",
            "Verify catalog rejects future issue date",
        )

    def test_catalog_rejects_production_date_after_issue(self) -> None:
        """Verify catalog rejects production date after issue."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE SERIALIZER TESTS: CATALOG REJECTS PRODUCTION DATE AFTER ISSUE"
        )
        data = dict(
            self.data, production_date=(self.today + timedelta(days=1)).isoformat()
        )
        serializer = CatalogQualityPassportIssueSerializer(
            data=data, context={"issuance_source": "catalog"}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("production_date", serializer.errors)
        self._logger_success(
            "catalog_rejects_production_date_after_issue",
            "Verify catalog rejects production date after issue",
        )

    def test_order_can_omit_issue_date(self) -> None:
        """Verify order can omit issue date."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE SERIALIZER TESTS: ORDER CAN OMIT ISSUE DATE"
        )
        data = {
            k: v for k, v in self.data.items() if k not in {"product_id", "issue_date"}
        }
        serializer = QualityPassportIssueSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self._logger_success(
            "order_can_omit_issue_date", "Verify order can omit issue date"
        )


class QualityPassportIssueServiceTests(APITestCase, TestLoggerMixin):
    """Verify quality passport issue service tests contracts."""

    def setUp(self) -> None:
        """Create fixtures for each test."""
        self.today = timezone.localdate()
        self.product = SimpleNamespace(pk=12)
        self.latest = SimpleNamespace(pk=25, issue_date=self.today - timedelta(days=2))
        self.fields = {
            "product_id": 12,
            "expected_latest_passport_id": 25,
            "number": 54673,
            "batch_number": "29.000",
            "production_date": self.today - timedelta(days=1),
            "quantity": Decimal("1.000"),
            "issue_date": self.today - timedelta(days=1),
            "issuance_source": "catalog",
        }
        self.product_lock = patch(
            "catalog.services.quality_passport_issue.Product.objects.select_for_update"
        )
        self.passport_model = patch(
            "catalog.services.quality_passport_issue.QualityPassport"
        )
        self.lock_mock = self.product_lock.start()
        self.model_mock = self.passport_model.start()
        self.addCleanup(self.product_lock.stop)
        self.addCleanup(self.passport_model.stop)
        self.lock_mock.return_value.get.return_value = self.product
        self.model_mock.last_issued.get_latest_for_product.return_value = self.latest

    def issue(self, **changes: Any) -> Mock:
        """Issue a passport using fixture defaults and supplied overrides."""
        fields: dict[str, Any] = self.fields | changes
        return cast(Mock, QualityPassportIssueService.issue(**fields))

    def test_catalog_creates_passport_without_order(self) -> None:
        """Verify catalog creates passport without order."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: CATALOG CREATES PASSPORT WITHOUT ORDER"
        )
        result = self.issue()
        self.assertIs(result, self.model_mock.return_value)
        self.model_mock.assert_called_once()
        self.assertEqual(self.model_mock.call_args.kwargs["product"], self.product)
        self.assertEqual(
            self.model_mock.call_args.kwargs["issue_date"],
            self.today - timedelta(days=1),
        )
        self.assertNotIn("order", self.model_mock.call_args.kwargs)
        result.save.assert_called_once_with()
        self._logger_success(
            "catalog_creates_passport_without_order",
            "Verify catalog creates passport without order",
        )

    def test_catalog_accepts_exactly_next_day(self) -> None:
        """Verify catalog accepts exactly next day."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: CATALOG ACCEPTS EXACTLY NEXT DAY"
        )
        result = self.issue(issue_date=self.latest.issue_date + timedelta(days=1))
        result.save.assert_called_once_with()
        self._logger_success(
            "catalog_accepts_exactly_next_day",
            "Verify catalog accepts exactly next day",
        )

    def test_catalog_rejects_same_day_as_previous(self) -> None:
        """Verify catalog rejects same day as previous."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: CATALOG REJECTS SAME DAY AS PREVIOUS"
        )
        with self.assertRaises(DjangoValidationError):
            self.issue(issue_date=self.latest.issue_date)
        self.model_mock.assert_not_called()
        self._logger_success(
            "catalog_rejects_same_day_as_previous",
            "Verify catalog rejects same day as previous",
        )

    def test_catalog_rejects_earlier_date(self) -> None:
        """Verify catalog rejects earlier date."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: CATALOG REJECTS EARLIER DATE"
        )
        with self.assertRaises(DjangoValidationError):
            self.issue(issue_date=self.latest.issue_date - timedelta(days=1))
        self.model_mock.assert_not_called()
        self._logger_success(
            "catalog_rejects_earlier_date", "Verify catalog rejects earlier date"
        )

    def test_catalog_rejects_future_date(self) -> None:
        """Verify catalog rejects future date."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: CATALOG REJECTS FUTURE DATE"
        )
        with self.assertRaises(DjangoValidationError):
            self.issue(issue_date=self.today + timedelta(days=1))
        self.model_mock.assert_not_called()
        self._logger_success(
            "catalog_rejects_future_date", "Verify catalog rejects future date"
        )

    def test_catalog_rejects_missing_latest(self) -> None:
        """Verify catalog rejects missing latest."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: CATALOG REJECTS MISSING LATEST"
        )
        self.model_mock.last_issued.get_latest_for_product.return_value = None
        with self.assertRaises(DjangoValidationError):
            self.issue(expected_latest_passport_id=None)
        self.model_mock.assert_not_called()
        self._logger_success(
            "catalog_rejects_missing_latest", "Verify catalog rejects missing latest"
        )

    def test_catalog_rejects_stale_latest_id(self) -> None:
        """Verify catalog rejects stale latest id."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: CATALOG REJECTS STALE LATEST ID"
        )
        with self.assertRaises(PassportChanged):
            self.issue(expected_latest_passport_id=999)
        self.model_mock.assert_not_called()
        self._logger_success(
            "catalog_rejects_stale_latest_id", "Verify catalog rejects stale latest id"
        )

    def test_order_still_allows_same_issue_date(self) -> None:
        """Verify order still allows same issue date."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: ORDER STILL ALLOWS SAME ISSUE DATE"
        )
        result = self.issue(issuance_source="order", issue_date=self.latest.issue_date)
        result.save.assert_called_once_with()
        self._logger_success(
            "order_still_allows_same_issue_date",
            "Verify order still allows same issue date",
        )

    def test_order_still_rejects_date_after_delivery(self) -> None:
        """Verify order still rejects date after delivery."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: ORDER STILL REJECTS DATE AFTER DELIVERY"
        )
        with self.assertRaises(DjangoValidationError):
            self.issue(
                issuance_source="order",
                issue_date=self.today,
                delivery_date=self.today - timedelta(days=1),
            )
        self._logger_success(
            "order_still_rejects_date_after_delivery",
            "Verify order still rejects date after delivery",
        )

    def test_order_preserves_auto_issue_date(self) -> None:
        """Verify order preserves auto issue date."""
        self._logger_header(
            "QUALITY PASSPORT ISSUE SERVICE TESTS: ORDER PRESERVES AUTO ISSUE DATE"
        )
        result = self.issue(issuance_source="order", issue_date=None)
        self.assertEqual(self.model_mock.call_args.kwargs["issue_date"], self.today)
        result.save.assert_called_once_with()
        self._logger_success(
            "order_preserves_auto_issue_date", "Verify order preserves auto issue date"
        )


class CatalogPassportIssueApiTests(APITestCase, TestLoggerMixin):
    """Verify catalog passport issue api tests contracts."""

    def setUp(self) -> None:
        """Create fixtures for each test."""
        self.factory = APIRequestFactory()
        self.today = timezone.localdate()
        self.body = {
            "product_id": 12,
            "expected_latest_passport_id": 25,
            "number": 54673,
            "batch_number": "29.000",
            "production_date": self.today.isoformat(),
            "issue_date": self.today.isoformat(),
            "quantity": "1.000",
        }

    def post(
        self, *, allowed: bool = True, body: dict[str, Any] | None = None
    ) -> Response:
        """Submit a passport issuance request with the requested permissions."""
        user = Mock()
        user.is_authenticated = True
        user.has_perm.return_value = allowed
        request = self.factory.post(
            reverse(f"catalog:{QualityPassportRoutes.CREATE.name}"),
            body or self.body,
            format="json",
        )
        force_authenticate(request, user=user)
        return QualityPassportIssueAPIView.as_view()(request)

    @patch("catalog.api.views.quality_passports.QualityPassportReadSerializer")
    @patch("catalog.api.views.quality_passports.QualityPassportIssueService.issue")
    @patch("catalog.api.views.quality_passports.get_object_or_404")
    def test_post_returns_201_and_uses_catalog_context(
        self, get_object: Mock, issue: Mock, read_serializer: Mock
    ) -> None:
        """Verify post returns 201 and uses catalog context."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE API TESTS: POST RETURNS 201 AND USES CATALOG CONTEXT"
        )
        get_object.return_value = SimpleNamespace(pk=12)
        read_serializer.return_value.data = {"id": 101}
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["id"], 101)
        self.assertEqual(issue.call_args.kwargs["issuance_source"], "catalog")
        self.assertEqual(issue.call_args.kwargs["product_id"], 12)
        self.assertEqual(issue.call_args.kwargs["expected_latest_passport_id"], 25)
        self.assertEqual(issue.call_args.kwargs["quantity"], Decimal("1.000"))
        self._logger_success(
            "post_returns_201_and_uses_catalog_context",
            "Verify post returns 201 and uses catalog context",
        )

    @patch("catalog.api.views.quality_passports.QualityPassportIssueService.issue")
    def test_post_requires_add_permission(self, issue: Mock) -> None:
        """Verify post requires add permission."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE API TESTS: POST REQUIRES ADD PERMISSION"
        )
        response = self.post(allowed=False)
        self.assertEqual(response.status_code, 403)
        issue.assert_not_called()
        self._logger_success(
            "post_requires_add_permission", "Verify post requires add permission"
        )

    @patch("catalog.api.views.quality_passports.QualityPassportIssueService.issue")
    def test_post_rejects_invalid_data(self, issue: Mock) -> None:
        """Verify post rejects invalid data."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE API TESTS: POST REJECTS INVALID DATA"
        )
        response = self.post(body={**self.body, "issue_date": "2099-01-01"})
        self.assertEqual(response.status_code, 400)
        issue.assert_not_called()
        self._logger_success(
            "post_rejects_invalid_data", "Verify post rejects invalid data"
        )

    @patch("catalog.api.views.quality_passports.get_object_or_404")
    def test_post_returns_404_for_missing_product(self, get_object: Mock) -> None:
        """Verify post returns 404 for missing product."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE API TESTS: POST RETURNS 404 FOR MISSING PRODUCT"
        )
        from django.http import Http404

        get_object.side_effect = Http404()
        response = self.post()
        self.assertEqual(response.status_code, 404)
        self._logger_success(
            "post_returns_404_for_missing_product",
            "Verify post returns 404 for missing product",
        )

    @patch("catalog.api.views.quality_passports.QualityPassportIssueService.issue")
    @patch("catalog.api.views.quality_passports.get_object_or_404")
    def test_post_returns_409_on_concurrent_latest_change(
        self, get_object: Mock, issue: Mock
    ) -> None:
        """Verify post returns 409 on concurrent latest change."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE API TESTS: POST RETURNS 409 ON CONCURRENT LATEST CHANGE"
        )
        get_object.return_value = SimpleNamespace(pk=12)
        issue.side_effect = PassportChanged()
        response = self.post()
        self.assertEqual(response.status_code, 409)
        self._logger_success(
            "post_returns_409_on_concurrent_latest_change",
            "Verify post returns 409 on concurrent latest change",
        )

    @patch("catalog.api.views.quality_passports.QualityPassportIssueService.issue")
    @patch("catalog.api.views.quality_passports.get_object_or_404")
    def test_post_translates_model_validation_to_400(
        self, get_object: Mock, issue: Mock
    ) -> None:
        """Verify post translates model validation to 400."""
        self._logger_header(
            "CATALOG PASSPORT ISSUE API TESTS: POST TRANSLATES MODEL VALIDATION TO 400"
        )
        get_object.return_value = SimpleNamespace(pk=12)
        issue.side_effect = DjangoValidationError({"quantity": "Неверная кратность."})
        response = self.post()
        self.assertEqual(response.status_code, 400)
        self.assertIn("quantity", response.data["errors"])
        self.assertEqual(
            str(response.data["errors"]["quantity"][0]),
            "Неверная кратность.",
        )
        self._logger_success(
            "post_translates_model_validation_to_400",
            "Verify post translates model validation to 400",
        )
