"""Quality passport limits tests."""

from decimal import Decimal

from rest_framework import status

from catalog.services.quality_passports import QualityPassportsService
from order.models import Order
from order.tests.quality_passport_test_base import QualityPassportTestBase


class TestOrderQualityPassportLimits(QualityPassportTestBase):
    __test__ = True

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
        """Activating a draft with an over-limit latest passport requires confirmation."""
        self._logger_header("LATEST PASSPORT: EXCEEDED LIMIT")

        new_passport = self._issue_new_passport()

        response = self.client.patch(
            self.url,
            {
                "status": Order.Status.CREATED,
                "products": [self._product_payload(self._exceeding_quantity())],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 409, response.data)
        self.order.refresh_from_db()
        self.item.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.DRAFT)
        self.assertIsNone(self.item.quality_passport_id)
        self.assertEqual(
            QualityPassportsService.used_quantity(new_passport),
            Decimal("0.000"),
        )
        self._logger_success(
            "quality_passport",
            "Latest passport exceeded; draft activation rolled back | 409",
        )

    def test_latest_passport_requires_confirmation_again(self) -> None:
        """Confirming a latest-passport overrun does not waive later confirmations."""
        self._logger_header("LATEST PASSPORT: REPEATED CONFIRMATION")

        new_passport = self._issue_new_passport()

        response = self.client.patch(
            self.url,
            {
                "status": Order.Status.CREATED,
                "products": [self._product_payload(self._exceeding_quantity())],
                "confirmed_passport_ids": [new_passport.pk],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quality_passport_id, new_passport.pk)

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
