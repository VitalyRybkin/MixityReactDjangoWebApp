"""Shared API fixtures and helpers for quality-passport order tests."""

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from catalog.models import AppUnit, Product, ProductUnit, QualityPassport
from catalog.services.quality_passports import QualityPassportsService
from catalog.tests.api.factories import ProductFactory, QualityPassportFactory
from catalog.utils.unit_choices import TitleChoices
from core.tests.utils import TestLoggerMixin
from order.models import Order, OrderItem
from order.routes import OrderRoutes


class QualityPassportTestBase(TestLoggerMixin, APITestCase):
    """Create one draft order and a quality passport; provide common helpers."""

    __test__ = False  # Pytest must collect only concrete suites below.

    def setUp(self) -> None:
        """Authenticate an administrator and create a draft item with an available passport."""
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

    def _create_quantity_test_product(
        self,
        *,
        is_piece_based: bool,
    ) -> Product:
        product = ProductFactory.create(
            is_piece_based=is_piece_based,
        )

        unit_title = TitleChoices.PIECE if is_piece_based else TitleChoices.TON

        unit, _ = AppUnit.objects.get_or_create(
            title=unit_title,
            defaults={
                "is_weight_based": not is_piece_based,
                "to_kg_factor": 1 if is_piece_based else 1000,
            },
        )

        ProductUnit.objects.update_or_create(
            product=product,
            defaults={
                "unit": unit,
                "value": 25 if is_piece_based else 1,
            },
        )

        QualityPassport.objects.create(
            product=product,
            number=f"REGRESSION-Q-{product.pk}",
            issue_date=self.passport.issue_date,
            production_date=self.passport.production_date,
            batch_number=f"REGRESSION-B-{product.pk}",
            quantity=Decimal("300.000"),
        )

        return product

    def _assert_invalid_quantity_rejected(
        self,
        *,
        product: Product,
        quantity: str,
    ) -> None:
        self.order.refresh_from_db()

        original_description = self.order.description

        original_items = list(
            OrderItem.objects.filter(order=self.order)
            .order_by("pk")
            .values_list(
                "product_id",
                "piece_based_quantity",
                "weight_quantity",
                "quality_passport_id",
            )
        )

        original_used = QualityPassportsService.used_quantity(self.passport)

        response = self.client.patch(
            self.url,
            {
                "description": "INVALID QUANTITY SHOULD NOT SAVE",
                "products": [
                    {
                        "product": product.pk,
                        "quantity": quantity,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)

        errors = response.data["errors"]

        self.assertIn("products", errors)
        self.assertIn("quantity", errors["products"][0])

        self.assertEqual(
            str(errors["products"][0]["quantity"][0]),
            "Количество должно быть больше нуля.",
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.description,
            original_description,
        )

        current_items = list(
            OrderItem.objects.filter(order=self.order)
            .order_by("pk")
            .values_list(
                "product_id",
                "piece_based_quantity",
                "weight_quantity",
                "quality_passport_id",
            )
        )

        self.assertEqual(current_items, original_items)

        self.assertEqual(
            QualityPassportsService.used_quantity(self.passport),
            original_used,
        )

    def _new_passport_data(self, quantity: Decimal) -> dict:
        """Build passport-issuance input referencing the expected latest passport."""
        return {
            "expected_latest_passport_id": self.passport.pk,
            "number": f"{self.passport.number}-NEW",
            "batch_number": self.passport.batch_number,
            "production_date": self.passport.production_date.isoformat(),
            "quantity": str(quantity),
        }

    def _product_payload(self, quantity: int) -> dict:
        """Build product input with the requested quantity in its native order unit."""
        return {
            "product": self.product.pk,
            "quantity": str(quantity),
        }

    def _exceeding_quantity(self) -> int:
        """Return a quantity exceeding the fixture passport limit for either product type."""
        return 40000 if self.product.is_piece_based else 350

    def _activate_order(self) -> None:
        """Move the draft to created status and verify its passport assignment."""
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
        """Issue a passport for the same product dated one day after the original."""
        return QualityPassportFactory.create(
            product=self.product,
            issue_date=self.passport.issue_date + timedelta(days=1),
            quantity=Decimal("300.000"),
        )
