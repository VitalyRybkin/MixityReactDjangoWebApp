"""Isolated deletion contracts for the service and API."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.urls import reverse
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from catalog.api.routes import QualityPassportRoutes
from catalog.api.views.quality_passports import QualityPassportRetrieveAPIView
from catalog.services.quality_passport_delete import (
    PassportCannotDelete,
    QualityPassportDeleteService,
)
from core.tests.utils import TestLoggerMixin


class PassportDeleteServiceTests(APITestCase, TestLoggerMixin):
    """Verify passport delete service tests contracts."""

    @patch("catalog.services.quality_passport_delete.OrderItem")
    @patch("catalog.services.quality_passport_delete.QualityPassport")
    @patch("catalog.services.quality_passport_delete.Product")
    @patch("catalog.services.quality_passport_delete.get_object_or_404")
    def test_delete_last_without_links(
        self,
        get_object: Mock,
        product_model: Mock,
        passport_model: Mock,
        order_item_model: Mock,
    ) -> None:
        """Verify delete last without links."""
        self._logger_header("PASSPORT DELETE SERVICE TESTS: DELETE LAST WITHOUT LINKS")
        product = SimpleNamespace(pk=7)
        passport = Mock(pk=13, product_id=7, product=product)
        get_object.side_effect = [passport, passport]
        passport_model.last_issued.get_latest_for_product.return_value = passport
        order_item_model.objects.filter.return_value.exists.return_value = False

        QualityPassportDeleteService.delete_latest_unassigned(passport_id=13)

        product_model.objects.select_for_update.assert_called_once()
        passport_model.objects.select_for_update.assert_called_once()
        order_item_model.objects.filter.assert_called_once_with(quality_passport_id=13)
        passport.delete.assert_called_once_with()
        self._logger_success(
            "delete_last_without_links", "Verify delete last without links"
        )

    @patch("catalog.services.quality_passport_delete.OrderItem")
    @patch("catalog.services.quality_passport_delete.QualityPassport")
    @patch("catalog.services.quality_passport_delete.Product")
    @patch("catalog.services.quality_passport_delete.get_object_or_404")
    def test_reject_historical(
        self,
        get_object: Mock,
        product_model: Mock,
        passport_model: Mock,
        order_item_model: Mock,
    ) -> None:
        """Verify reject historical."""
        self._logger_header("PASSPORT DELETE SERVICE TESTS: REJECT HISTORICAL")
        passport = Mock(pk=13, product_id=7, product=SimpleNamespace(pk=7))
        get_object.side_effect = [passport, passport]
        passport_model.last_issued.get_latest_for_product.return_value = Mock(pk=14)

        with self.assertRaises(PassportCannotDelete):
            QualityPassportDeleteService.delete_latest_unassigned(passport_id=13)
        passport.delete.assert_not_called()
        order_item_model.objects.filter.assert_not_called()
        self._logger_success("reject_historical", "Verify reject historical")

    @patch("catalog.services.quality_passport_delete.OrderItem")
    @patch("catalog.services.quality_passport_delete.QualityPassport")
    @patch("catalog.services.quality_passport_delete.Product")
    @patch("catalog.services.quality_passport_delete.get_object_or_404")
    def test_reject_linked_even_if_draft(
        self,
        get_object: Mock,
        product_model: Mock,
        passport_model: Mock,
        order_item_model: Mock,
    ) -> None:
        """Verify reject linked even if draft."""
        self._logger_header(
            "PASSPORT DELETE SERVICE TESTS: REJECT LINKED EVEN IF DRAFT"
        )
        passport = Mock(pk=13, product_id=7, product=SimpleNamespace(pk=7))
        get_object.side_effect = [passport, passport]
        passport_model.last_issued.get_latest_for_product.return_value = passport
        order_item_model.objects.filter.return_value.exists.return_value = True

        with self.assertRaises(PassportCannotDelete):
            QualityPassportDeleteService.delete_latest_unassigned(passport_id=13)
        passport.delete.assert_not_called()
        # This intentionally uses no order status filter.
        order_item_model.objects.filter.assert_called_once_with(quality_passport_id=13)
        self._logger_success(
            "reject_linked_even_if_draft", "Verify reject linked even if draft"
        )


class PassportDeleteApiTests(APITestCase, TestLoggerMixin):
    """Verify passport delete api tests contracts."""

    def setUp(self) -> None:
        """Create fixtures for each test."""
        self.factory = APIRequestFactory()

    def delete(self, allowed: bool = True) -> Response:
        """Submit a passport deletion request with the requested permissions."""
        user = Mock(is_authenticated=True)
        user.has_perm.return_value = allowed
        request = self.factory.delete(
            reverse(f"catalog:{QualityPassportRoutes.DETAIL.name}", args=[13])
        )
        force_authenticate(request, user=user)
        response = QualityPassportRetrieveAPIView.as_view()(request, pk=13)
        user.has_perm.assert_called_with("catalog.delete_qualitypassport")
        return response

    @patch(
        "catalog.api.views.quality_passports.QualityPassportDeleteService.delete_latest_unassigned"
    )
    def test_delete_returns_204(self, delete_service: Mock) -> None:
        """Verify delete returns 204."""
        self._logger_header("PASSPORT DELETE API TESTS: DELETE RETURNS 204")
        response = self.delete()
        self.assertEqual(response.status_code, 204)
        delete_service.assert_called_once_with(passport_id=13)
        self._logger_success("delete_returns_204", "Verify delete returns 204")

    @patch(
        "catalog.api.views.quality_passports.QualityPassportDeleteService.delete_latest_unassigned"
    )
    def test_delete_requires_permission(self, delete_service: Mock) -> None:
        """Verify delete requires permission."""
        self._logger_header("PASSPORT DELETE API TESTS: DELETE REQUIRES PERMISSION")
        response = self.delete(allowed=False)
        self.assertEqual(response.status_code, 403)
        delete_service.assert_not_called()
        self._logger_success(
            "delete_requires_permission", "Verify delete requires permission"
        )

    @patch(
        "catalog.api.views.quality_passports.QualityPassportDeleteService.delete_latest_unassigned"
    )
    def test_delete_conflict_returns_409(self, delete_service: Mock) -> None:
        """Verify delete conflict returns 409."""
        self._logger_header("PASSPORT DELETE API TESTS: DELETE CONFLICT RETURNS 409")
        delete_service.side_effect = PassportCannotDelete("Связан с заявкой")
        self.assertEqual(self.delete().status_code, 409)
        self._logger_success(
            "delete_conflict_returns_409", "Verify delete conflict returns 409"
        )
