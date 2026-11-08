"""API tests for order quality-passport assignment and quantity limits."""

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
    """Verify passport lifecycle, limit confirmation, and rollback on order updates."""

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

    def _new_passport_data(self, quantity: Decimal) -> dict:
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

    def test_draft_does_not_assign_passport(self) -> None:
        """Verify drafts discard explicit passport selections and consume no quantity."""
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
        """Verify a status-only transition assigns the latest passport and consumes quantity."""
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
        """Verify an unconfirmed overrun returns 409 and rolls back order and item changes."""

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
        """Verify explicit confirmation allows saving an order above its passport limit."""
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
        """Verify returning to draft clears the passport and releases its consumed quantity."""
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
        """Verify issuing a newer passport does not replace an existing item assignment."""
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
        """Verify quantity edits and repeated saves count the current item quantity only once."""
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
        """Verify deleting an order removes its contribution to passport consumption."""
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
        """Verify selecting another passport transfers consumption from the original passport."""
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

    def test_historical_passport_exceeded_does_not_block_update(self) -> None:
        """Verify an over-limit historical passport remains linked without requiring confirmation."""
        self._logger_header("HISTORICAL PASSPORT: IGNORE EXCEEDED LIMIT")

        self._activate_order()

        quantity = self._exceeding_quantity()

        # Сначала допускаем превышение действующего паспорта.
        response = self.client.patch(
            self.url,
            {
                "products": [self._product_payload(quantity)],
                "confirmed_passport_ids": [self.passport.pk],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)

        # Выпускаем новый паспорт.
        new_passport = self._issue_new_passport()

        # Редактирование заявки со старым паспортом.
        response = self.client.patch(
            self.url,
            {
                "products": [self._product_payload(quantity + 1)],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)

        self.item.refresh_from_db()

        # Старый паспорт остаётся привязанным.
        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        # Его расход всё ещё рассчитывается.
        self.assertGreater(
            QualityPassportsService.used_quantity(self.passport),
            self.passport.quantity,
        )

        # Новый паспорт ещё не использован.
        self.assertEqual(
            QualityPassportsService.used_quantity(new_passport),
            Decimal("0.000"),
        )

        self._logger_success(
            "quality_passport",
            "Historical passport remains linked without HTTP 409",
        )

    def test_latest_passport_exceeded_returns_409(self) -> None:
        """Verify an unconfirmed latest-passport overrun preserves the original assignment."""
        self._logger_header("LATEST PASSPORT: EXCEEDED LIMIT")

        self._activate_order()
        new_passport = self._issue_new_passport()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    {
                        **self._product_payload(self._exceeding_quantity()),
                        "quality_passport": new_passport.pk,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 409, response.data)

        # После отката историческая связь не изменилась.
        self.item.refresh_from_db()
        self.assertEqual(
            self.item.quality_passport_id,
            self.passport.pk,
        )

        self._logger_success(
            "quality_passport",
            "Latest passport exceeded; changes rolled back | 409",
        )

    def test_latest_passport_requires_confirmation_again(self) -> None:
        """Verify every save requires confirmation while the latest passport remains over limit."""
        self._logger_header("LATEST PASSPORT: REPEATED CONFIRMATION")

        self._activate_order()
        new_passport = self._issue_new_passport()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    {
                        **self._product_payload(self._exceeding_quantity()),
                        "quality_passport": new_passport.pk,
                    }
                ],
                "confirmed_passport_ids": [new_passport.pk],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)

        # Повторное сохранение без подтверждения.
        response = self.client.patch(
            self.url,
            {"description": "Repeated save"},
            format="json",
        )

        self.assertEqual(response.status_code, 409, response.data)

        self._logger_success(
            "quality_passport",
            "Current passport requires confirmation on every save",
        )

    def test_latest_passport_same_date_uses_highest_id(self) -> None:
        """Verify passports with equal issue dates are ordered by descending primary key."""
        self._logger_header("LATEST PASSPORT: SAME ISSUE DATE")

        new_passport = QualityPassportFactory.create(
            product=self.product,
            issue_date=self.passport.issue_date,
            quantity=Decimal("300.000"),
        )

        latest = QualityPassport.last_issued.get_latest_for_product(self.product)

        self.assertIsNotNone(latest)
        assert latest is not None
        self.assertEqual(latest.pk, new_passport.pk)

        self._logger_success(
            "quality_passport",
            "Same issue date: highest ID is the latest passport",
        )

    def test_issue_new_passport_during_order_update(self) -> None:
        self._logger_header("ORDER: ISSUE NEW QUALITY PASSPORT")

        self._activate_order()

        quantity = self._exceeding_quantity()

        if self.product.is_piece_based:
            item_tons = (
                Decimal(str(quantity))
                * Decimal(self.product.unit_config.value)
                / Decimal("1000")
            )
        else:
            item_tons = Decimal(str(quantity))

        # Для навальной продукции округляем вверх до 0.100 т.
        if not self.product.is_piece_based:
            from decimal import ROUND_CEILING

            step = Decimal("0.100")
            item_tons = (item_tons / step).to_integral_value(
                rounding=ROUND_CEILING
            ) * step

        new_quantity = item_tons * Decimal("2")

        count_before = QualityPassport.objects.count()

        response = self.client.patch(
            self.url,
            {
                "products": [
                    {
                        **self._product_payload(quantity),
                        "new_quality_passport": self._new_passport_data(new_quantity),
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(
            QualityPassport.objects.count(),
            count_before + 1,
        )

        new_passport = QualityPassport.objects.get(number=f"{self.passport.number}-NEW")

        self.item.refresh_from_db()

        self.assertEqual(
            self.item.quality_passport_id,
            new_passport.pk,
        )

        latest = QualityPassport.last_issued.get_latest_for_product(self.product)

        assert latest is not None

        self.assertEqual(latest.pk, new_passport.pk)

        self._logger_success(
            "quality_passport",
            "New passport issued and linked to order item",
        )

    def test_failed_passport_issue_rolls_back_order(self) -> None:
        self._logger_header("ORDER: PASSPORT ISSUE ROLLBACK")

        self._activate_order()

        count_before = QualityPassport.objects.count()
        original_passport_id = self.item.quality_passport_id

        passport_data = self._new_passport_data(Decimal("300.000"))
        passport_data["number"] = self.passport.number

        response = self.client.patch(
            self.url,
            {
                "description": "Should be rolled back",
                "products": [
                    {
                        **self._product_payload(self._exceeding_quantity()),
                        "new_quality_passport": passport_data,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)

        self.assertEqual(
            QualityPassport.objects.count(),
            count_before,
        )

        self.item.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(
            self.item.quality_passport_id,
            original_passport_id,
        )
        self.assertNotEqual(
            self.order.description,
            "Should be rolled back",
        )

        self._logger_success(
            "quality_passport",
            "Failed issue rolled back passport and order changes",
        )
