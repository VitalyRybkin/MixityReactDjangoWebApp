from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import QualityPassport
from catalog.tests.api.factories import QualityPassportFactory
from core.tests.utils import TestLoggerMixin
from order.models import Order, OrderItem
from order.routes import OrderRoutes
from order.services.quality_passports import QualityPassportsService


class TestOrderQualityPassports(
    TestLoggerMixin,
    APITestCase,
):

    def setUp(self) -> None:
        super().setUp()

        user_model = get_user_model()
        user = user_model.objects.create_superuser(
            username="passport_test_admin",
            email="passport@example.com",
            password="test_password",
        )
        self.client.force_authenticate(user=user)

        self.passport = QualityPassportFactory.create()
        self.passport.quantity = Decimal("300.000")
        self.passport.save()

        self.product = self.passport.product

        self.order = Order.objects.create(
            status=Order.Status.DRAFT,
            description="Original description",
        )

        is_piece = self.product.is_piece_based

        quantities: dict[str, int | Decimal | None] = {
            "piece_based_quantity": 10 if is_piece else None,
            "weight_quantity": None if is_piece else Decimal("1.00"),
        }

        self.item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            **quantities,
        )

        self.url = reverse(
            f"order_orders:{OrderRoutes.DETAIL.name}",
            args=[self.order.pk],
        )

    def _product_payload(self, quantity: int) -> dict:
        return {
            "product": self.product.pk,
            "quantity": str(quantity),
        }

    def _exceeding_quantity(self) -> int:
        return 40000 if self.product.is_piece_based else 350

    def _activate_order(self) -> None:
        response = self.client.patch(
            self.url,
            {"status": Order.Status.CREATED},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()
        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

    def _issue_new_passport(self) -> QualityPassport:
        return QualityPassportFactory.create(
            product=self.product,
            issue_date=self.passport.issue_date + timedelta(days=1),
            quantity=Decimal("300.000"),
        )

    def test_draft_does_not_assign_passport(self) -> None:
        self._logger_header("DRAFT ORDER: DO NOT ASSIGN PASSPORT")
        response = self.client.patch(
            self.url,
            {
                "status": Order.Status.DRAFT,
                "products": [
                    {
                        **self._product_payload(10),
                        "quality_passport": self.passport.pk,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()
        self.assertIsNone(self.item.quality_passport_id)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Draft ignores selected passport and consumes no quantity | 200",
        )

    def test_draft_to_created_assigns_passport(self) -> None:
        self._logger_header("DRAFT → CREATED: ASSIGN PASSPORT")
        response = self.client.patch(
            self.url,
            {"status": Order.Status.CREATED},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.order.refresh_from_db()
        self.item.refresh_from_db()

        self.assertEqual(self.order.status, Order.Status.CREATED)
        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Latest passport assigned and quantity consumed | 200",
        )

    def test_exceeded_limit_rolls_back_changes(self) -> None:

        self._logger_header("PASSPORT LIMIT EXCEEDED: ROLL BACK ORDER CHANGES")
        response = self.client.patch(
            self.url,
            {
                "status": Order.Status.CREATED,
                "description": "Changed description",
                "products": [self._product_payload(self._exceeding_quantity())],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_409_CONFLICT,
            response.data,
        )

        self.order.refresh_from_db()
        self.item.refresh_from_db()

        self.assertEqual(self.order.status, Order.Status.DRAFT)
        self.assertEqual(
            self.order.description,
            "Original description",
        )
        self.assertIsNone(self.item.quality_passport_id)

        expected_quantity = 10 if self.product.is_piece_based else None
        self.assertEqual(
            self.item.piece_based_quantity,
            expected_quantity,
        )

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "rollback",
            "Unconfirmed excess rejected; status, description, quantity and passport unchanged | 409",
        )

    def test_confirmed_exceeded_limit_saves_order(self) -> None:
        self._logger_header("PASSPORT LIMIT EXCEEDED: SAVE WITH CONFIRMATION")
        response = self.client.patch(
            self.url,
            {
                "status": Order.Status.CREATED,
                "products": [self._product_payload(self._exceeding_quantity())],
                "confirmed_passport_ids": [self.passport.pk],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.order.refresh_from_db()
        self.item.refresh_from_db()

        self.assertEqual(self.order.status, Order.Status.CREATED)
        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            self.passport.quantity,
        )

        self._logger_success(
            "confirmed_passport_ids",
            "Confirmed excess saved with passport assigned | 200",
        )

    def test_created_to_draft_releases_quantity(self) -> None:
        self._logger_header("CREATED → DRAFT: RELEASE PASSPORT QUANTITY")
        self.order.status = Order.Status.CREATED
        self.order.save()

        self.item.quality_passport = self.passport
        self.item.save(update_fields=["quality_passport"])

        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        response = self.client.patch(
            self.url,
            {"status": Order.Status.DRAFT},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()
        self.assertIsNone(self.item.quality_passport_id)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Status-only update clears passport and releases quantity | 200",
        )

    def test_new_passport_does_not_replace_historical(self) -> None:
        self._logger_header("HISTORICAL PASSPORT")

        self._activate_order()

        new_passport = self._issue_new_passport()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    self._product_payload(10),
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()

        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        self.assertEqual(
            QualityPassportsService.used_quantity(new_passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Historical passport preserved",
        )

    def test_update_quantity_does_not_double_count(self) -> None:
        self._logger_header("UPDATE QUANTITY WITHOUT DOUBLE COUNT")

        self._activate_order()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    self._product_payload(15),
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()

        expected = QualityPassportsService.item_quantity_tons(self.item)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            expected,
        )

        response = self.client.patch(
            self.url,
            {"description": "Repeated save"},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            expected,
        )

        self._logger_success(
            "used_quantity",
            "Quantity recalculated without double counting",
        )

    def test_delete_order_releases_passport_quantity(self) -> None:
        self._logger_header("DELETE ORDER RELEASES QUANTITY")

        self._activate_order()

        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, 204)

        self.assertFalse(Order.objects.filter(pk=self.order.pk).exists())

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "used_quantity",
            "Order deleted and quantity released",
        )

    def test_explicit_passport_selection(self) -> None:
        self._logger_header("EXPLICIT PASSPORT SELECTION")

        self._activate_order()

        new_passport = self._issue_new_passport()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    {
                        **self._product_payload(10),
                        "quality_passport": new_passport.pk,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()

        self.assertEqual(
            self.item.quality_passport_id,
            new_passport.pk,
        )

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            Decimal("0.000"),
        )

        self.assertEqual(
            QualityPassportsService.used_quantity(new_passport),
            QualityPassportsService.item_quantity_tons(self.item),
        )

        self._logger_success(
            "quality_passport",
            "Explicit passport selection saved successfully",
        )
