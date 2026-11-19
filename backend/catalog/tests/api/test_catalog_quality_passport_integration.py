"""Database-backed contract tests for catalog passport issuance and deletion.

Runs on the configured Django test database (SQLite or PostgreSQL).
Concurrency and row locking still require separate PostgreSQL tests.
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import ClassVar, Literal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.exceptions import ValidationError as DjangoValidationError
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from catalog.api.routes import QualityPassportRoutes
from catalog.models import AppUnit, Product, QualityPassport
from catalog.services.quality_passport_delete import (
    PassportCannotDelete,
    QualityPassportDeleteService,
)
from catalog.services.quality_passport_issue import (
    PassportChanged,
    QualityPassportIssueService,
)
from catalog.tests.api.factories import ProductFactory, ProductUnitFactory
from catalog.utils.unit_choices import TitleChoices
from core.tests.utils import TestLoggerMixin
from order.models import Order
from order.tests.factories import OrderFactory, OrderItemFactory


class TestQualityPassportCatalogIntegration(APITestCase, TestLoggerMixin):
    """Exercise issuance and deletion against real model records."""

    product: ClassVar[Product]

    __test__ = True

    @classmethod
    def setUpTestData(cls) -> None:
        """Create shared database fixtures."""
        cls.product = ProductFactory.create(is_piece_based=False)
        ton, _ = AppUnit.objects.get_or_create(
            title=TitleChoices.TON,
            defaults={"is_weight_based": True, "to_kg_factor": 1000},
        )
        ProductUnitFactory.create(product=cls.product, unit=ton, value=1)

    def setUp(self) -> None:
        """Create fixtures for each test."""
        self.today = timezone.localdate()
        self.previous_date = self.today - timedelta(days=3)
        self.previous = QualityPassport.objects.create(
            product=self.product,
            number="PG-INITIAL-1",
            issue_date=self.previous_date,
            batch_number="INITIAL",
            production_date=self.previous_date,
            quantity=Decimal("10.000"),
        )

    def issue(
        self,
        *,
        issue_date: date | None = None,
        number: str = "PG-NEXT-2",
        quantity: Decimal = Decimal("2.000"),
        expected_latest_passport_id: int | None = None,
        issuance_source: Literal["order", "catalog"] = "catalog",
        delivery_date: date | None = None,
    ) -> QualityPassport:
        """Issue a passport using fixture defaults and supplied overrides."""
        date_value = (
            issue_date
            if issue_date is not None
            else self.previous_date + timedelta(days=1)
        )
        return QualityPassportIssueService.issue(
            product_id=self.product.pk,
            expected_latest_passport_id=(
                expected_latest_passport_id
                if expected_latest_passport_id is not None
                else self.previous.pk
            ),
            number=number,
            batch_number="NEW-BATCH",
            production_date=date_value,
            quantity=quantity,
            issue_date=date_value,
            delivery_date=delivery_date,
            issuance_source=issuance_source,
        )

    def test_catalog_issue_persists_and_becomes_latest(self) -> None:
        """Verify catalog issue persists and becomes latest."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: CATALOG ISSUE PERSISTS AND BECOMES LATEST"
        )
        passport = self.issue()
        persisted = QualityPassport.objects.get(pk=passport.pk)
        self.assertEqual(persisted.product_id, self.product.pk)
        self.assertEqual(persisted.quantity, Decimal("2.000"))
        current_latest = QualityPassport.last_issued.get_latest_for_product(
            self.product
        )
        assert current_latest is not None
        self.assertEqual(
            current_latest.pk,
            passport.pk,
        )
        self.assertEqual(persisted.order_items.count(), 0)
        self.assertEqual(
            QualityPassport.objects.filter(product=self.product).count(), 2
        )
        self._logger_success(
            "catalog_issue_persists_and_becomes_latest",
            "Verify catalog issue persists and becomes latest",
        )

    def test_catalog_state_allows_issuer_without_order_view_permission(self) -> None:
        product = ProductFactory.create(is_piece_based=True)
        ProductUnitFactory.create(product=product, value=25)
        passport = QualityPassport.objects.create(
            product=product,
            number="PIECE-STATE-1",
            batch_number="PIECE-STATE",
            issue_date=self.previous_date,
            production_date=self.previous_date,
            quantity=Decimal("2.000"),
        )
        user = get_user_model().objects.create_user(username="catalog_passport_issuer")
        user.user_permissions.add(
            *Permission.objects.filter(
                content_type__app_label="catalog",
                codename__in=["view_product", "add_qualitypassport"],
            )
        )
        self.client.force_authenticate(user=user)
        url = reverse(f"catalog:{QualityPassportRoutes.STATE.name}")
        params = {
            "product_id": product.pk,
            "order_id": 999999,
            "quantity": "1",
            "target_status": Order.Status.CREATED,
        }

        catalog = self.client.get(url, {"source": "catalog", **params})
        order = self.client.get(url, params)

        self.assertEqual(catalog.status_code, 200, catalog.data)
        self.assertEqual(catalog.data["latest_passport_id"], passport.pk)
        self.assertEqual(catalog.data["passport"]["id"], passport.pk)
        self.assertTrue(catalog.data["product"]["is_piece_based"])
        self.assertEqual(catalog.data["product"]["product_unit"]["value"], 25)
        self.assertIsNone(catalog.data["projected_used_quantity"])
        self.assertEqual(order.status_code, 403, order.data)

    def test_catalog_state_order_state_and_detail_permission_matrix(self) -> None:
        product_view = ("catalog", "view_product")
        passport_view = ("catalog", "view_qualitypassport")
        passport_add = ("catalog", "add_qualitypassport")
        order_view = ("order", "view_order")
        # The expected statuses are for Catalog state, order state, and detail.
        cases = (
            ((product_view,), (403, 403, 403)),
            ((product_view, passport_view), (200, 403, 200)),
            ((product_view, passport_add), (200, 403, 403)),
            ((product_view, order_view), (200, 200, 403)),
            ((passport_view, passport_add, order_view), (403, 200, 200)),
            ((product_view, passport_view, passport_add, order_view), (200, 200, 200)),
        )
        state_url = reverse(f"catalog:{QualityPassportRoutes.STATE.name}")
        detail_url = reverse(
            f"catalog:{QualityPassportRoutes.DETAIL.name}", args=[self.previous.pk]
        )
        state_params = {"product_id": self.product.pk}

        for index, (permissions, expected) in enumerate(cases):
            with self.subTest(permissions=permissions):
                user = get_user_model().objects.create_user(
                    username=f"passport_permissions_{index}"
                )
                user.user_permissions.add(
                    *(
                        Permission.objects.get(
                            content_type__app_label=app, codename=codename
                        )
                        for app, codename in permissions
                    )
                )
                self.client.force_authenticate(user=user)
                catalog = self.client.get(
                    state_url, {**state_params, "source": "catalog"}
                )
                order = self.client.get(state_url, state_params)
                detail = self.client.get(detail_url)
                self.assertEqual(
                    (catalog.status_code, order.status_code, detail.status_code),
                    expected,
                )

    def test_catalog_allows_next_calendar_day(self) -> None:
        """Verify catalog allows next calendar day."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: CATALOG ALLOWS NEXT CALENDAR DAY"
        )
        passport = self.issue(issue_date=self.previous_date + timedelta(days=1))
        self.assertEqual(passport.issue_date, self.previous_date + timedelta(days=1))
        self._logger_success(
            "catalog_allows_next_calendar_day",
            "Verify catalog allows next calendar day",
        )

    def test_catalog_rejects_same_date_without_inserting(self) -> None:
        """Verify catalog rejects same date without inserting."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: CATALOG REJECTS SAME DATE WITHOUT INSERTING"
        )
        with self.assertRaises(DjangoValidationError):
            self.issue(issue_date=self.previous_date)
        self.assertEqual(
            QualityPassport.objects.filter(product=self.product).count(), 1
        )
        self._logger_success(
            "catalog_rejects_same_date_without_inserting",
            "Verify catalog rejects same date without inserting",
        )

    def test_catalog_rejects_future_date_without_inserting(self) -> None:
        """Verify catalog rejects future date without inserting."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: CATALOG REJECTS FUTURE DATE WITHOUT INSERTING"
        )
        with self.assertRaises(DjangoValidationError):
            self.issue(issue_date=self.today + timedelta(days=1))
        self.assertEqual(
            QualityPassport.objects.filter(product=self.product).count(), 1
        )
        self._logger_success(
            "catalog_rejects_future_date_without_inserting",
            "Verify catalog rejects future date without inserting",
        )

    def test_catalog_enforces_quantity_step_on_real_model(self) -> None:
        """Verify catalog enforces quantity step on real model."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: CATALOG ENFORCES QUANTITY STEP ON REAL MODEL"
        )
        with self.assertRaises(DjangoValidationError):
            self.issue(quantity=Decimal("2.005"))
        self.assertEqual(
            QualityPassport.objects.filter(product=self.product).count(), 1
        )
        self._logger_success(
            "catalog_enforces_quantity_step_on_real_model",
            "Verify catalog enforces quantity step on real model",
        )

    def test_stale_latest_id_raises_conflict(self) -> None:
        """Verify stale latest id raises conflict."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: STALE LATEST ID RAISES CONFLICT"
        )
        first_new = self.issue()
        with self.assertRaises(PassportChanged):
            self.issue(
                number="PG-OTHER-3",
                issue_date=self.today,
                expected_latest_passport_id=self.previous.pk,
            )
        current_latest = QualityPassport.last_issued.get_latest_for_product(
            self.product
        )
        assert current_latest is not None
        self.assertEqual(
            current_latest.pk,
            first_new.pk,
        )
        self._logger_success(
            "stale_latest_id_raises_conflict", "Verify stale latest id raises conflict"
        )

    def test_order_source_keeps_same_date_allowed(self) -> None:
        """Verify order source keeps same date allowed."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: ORDER SOURCE KEEPS SAME DATE ALLOWED"
        )
        passport = self.issue(
            issue_date=self.previous_date,
            issuance_source="order",
            delivery_date=self.today,
        )
        self.assertEqual(passport.issue_date, self.previous_date)
        self._logger_success(
            "order_source_keeps_same_date_allowed",
            "Verify order source keeps same date allowed",
        )

    def test_delete_last_unassigned_restores_previous(self) -> None:
        """Verify delete last unassigned restores previous."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: DELETE LAST UNASSIGNED RESTORES PREVIOUS"
        )
        latest = self.issue()
        QualityPassportDeleteService.delete_latest_unassigned(passport_id=latest.pk)
        self.assertFalse(QualityPassport.objects.filter(pk=latest.pk).exists())
        self.assertTrue(QualityPassport.objects.filter(pk=self.previous.pk).exists())
        current_latest = QualityPassport.last_issued.get_latest_for_product(
            self.product
        )
        assert current_latest is not None
        self.assertEqual(
            current_latest.pk,
            self.previous.pk,
        )
        self._logger_success(
            "delete_last_unassigned_restores_previous",
            "Verify delete last unassigned restores previous",
        )

    def test_delete_historical_passport_rejected(self) -> None:
        """Verify delete historical passport rejected."""
        self._logger_header(
            "QUALITY PASSPORT CATALOG INTEGRATION: DELETE HISTORICAL PASSPORT REJECTED"
        )
        latest = self.issue()
        with self.assertRaises(PassportCannotDelete):
            QualityPassportDeleteService.delete_latest_unassigned(
                passport_id=self.previous.pk
            )
        self.assertTrue(QualityPassport.objects.filter(pk=self.previous.pk).exists())
        self.assertTrue(QualityPassport.objects.filter(pk=latest.pk).exists())
        self._logger_success(
            "delete_historical_passport_rejected",
            "Verify delete historical passport rejected",
        )

    def _assert_linked_passport_cannot_be_deleted(self, *, order_status: str) -> None:
        """A real OrderItem link blocks deletion regardless of order status."""
        latest = self.issue()
        order = OrderFactory.create(status=order_status)
        item = OrderItemFactory.create(
            order=order,
            product=self.product,
            quality_passport=latest,
            weight_quantity=Decimal("1.00"),
        )

        self.assertEqual(order.status, order_status)
        self.assertEqual(item.quality_passport_id, latest.pk)
        self.assertTrue(latest.order_items.filter(pk=item.pk).exists())

        with self.assertRaises(PassportCannotDelete):
            QualityPassportDeleteService.delete_latest_unassigned(passport_id=latest.pk)

        latest.refresh_from_db()
        item.refresh_from_db()
        self.assertEqual(item.quality_passport_id, latest.pk)
        self.assertEqual(latest.order_items.count(), 1)
        current_latest = QualityPassport.last_issued.get_latest_for_product(
            self.product
        )
        assert current_latest is not None
        self.assertEqual(
            current_latest.pk,
            latest.pk,
        )
        self.assertTrue(QualityPassport.objects.filter(pk=self.previous.pk).exists())

    def test_delete_latest_passport_linked_to_draft_order_rejected(self) -> None:
        """Even a draft order's existing OrderItem link blocks deletion."""
        self._logger_header("PASSPORT: DELETE LINKED TO DRAFT ORDER")
        self._assert_linked_passport_cannot_be_deleted(order_status=Order.Status.DRAFT)
        self._logger_success(
            "quality_passport", "Draft link preserved; deletion rejected"
        )

    def test_delete_latest_passport_linked_to_created_order_rejected(self) -> None:
        """A created order's OrderItem link blocks deletion."""
        self._logger_header("PASSPORT: DELETE LINKED TO CREATED ORDER")
        self._assert_linked_passport_cannot_be_deleted(
            order_status=Order.Status.CREATED
        )
        self._logger_success(
            "quality_passport", "Created-order link preserved; deletion rejected"
        )

    def test_delete_linked_draft_passport_api_returns_409(self) -> None:
        """The real DELETE endpoint returns 409 and preserves the DB records."""
        self._logger_header("ENDPOINT DELETE: LINKED DRAFT PASSPORT")
        latest = self.issue()
        order = OrderFactory.create(status=Order.Status.DRAFT)
        item = OrderItemFactory.create(
            order=order,
            product=self.product,
            quality_passport=latest,
            weight_quantity=Decimal("1.00"),
        )
        user = get_user_model().objects.create_superuser(
            username="passport_linked_delete_admin",
            password="test_password",
        )
        self.client.force_authenticate(user=user)
        url = reverse(
            f"catalog:{QualityPassportRoutes.DETAIL.name}",
            kwargs={"pk": latest.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, 409, response.data)
        self.assertTrue(QualityPassport.objects.filter(pk=latest.pk).exists())
        item.refresh_from_db()
        self.assertEqual(item.quality_passport_id, latest.pk)
        self._logger_success("quality_passport", "Linked draft deletion rejected | 409")
