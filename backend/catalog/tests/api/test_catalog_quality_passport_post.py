"""Test Catalog passport issuance through its routed API and the database."""

from datetime import date, timedelta
from decimal import Decimal
from typing import ClassVar

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission, User
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.api.routes import QualityPassportRoutes
from catalog.models import AppUnit, Product, QualityPassport
from catalog.tests.api.factories import ProductFactory, ProductUnitFactory
from catalog.utils.unit_choices import TitleChoices
from core.tests.utils import TestLoggerMixin
from order.models import Order
from order.tests.factories import OrderFactory, OrderItemFactory


class TestCatalogQualityPassportPost(TestLoggerMixin, APITestCase):
    today: ClassVar[date]
    product: ClassVar[Product]
    previous: ClassVar[QualityPassport]
    issuer: ClassVar[User]

    @classmethod
    def setUpTestData(cls) -> None:
        cls.today = timezone.localdate()
        cls.product = ProductFactory.create(is_piece_based=False)
        ton, _ = AppUnit.objects.get_or_create(
            title=TitleChoices.TON,
            defaults={"is_weight_based": True, "to_kg_factor": 1000},
        )
        ProductUnitFactory.create(product=cls.product, unit=ton, value=1)
        cls.previous = QualityPassport.objects.create(
            product=cls.product,
            number=54672,
            issue_date=cls.today - timedelta(days=2),
            batch_number="28.999",
            production_date=cls.today - timedelta(days=3),
            quantity=Decimal("10.000"),
        )
        cls.issuer = get_user_model().objects.create_user(username="passport_issuer")
        cls.issuer.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="catalog", codename="add_qualitypassport"
            )
        )

    def setUp(self) -> None:
        self.client.force_authenticate(user=self.issuer)
        self.url = reverse(f"catalog:{QualityPassportRoutes.CREATE.name}")
        self.payload: dict[str, int | str] = {
            "product_id": self.product.pk,
            "expected_latest_passport_id": self.previous.pk,
            "number": 54673,
            "issue_date": self.today.isoformat(),
            "batch_number": "29.000",
            "production_date": self.today.isoformat(),
            "quantity": "2.000",
        }

    def test_creates_passport_and_preserves_previous_passport_and_order_assignment(
        self,
    ) -> None:
        self._logger_header("CATALOG QUALITY PASSPORT: POST A NEW PASSPORT")
        item = OrderItemFactory.create(
            order=OrderFactory.create(status=Order.Status.CREATED),
            product=self.product,
            quality_passport=self.previous,
            weight_quantity=Decimal("1.00"),
        )
        previous = QualityPassport.objects.filter(pk=self.previous.pk).values().get()

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["product"]["id"], self.product.pk)
        self.assertEqual(response.data["specifications"], [])
        for field in (
            "number",
            "issue_date",
            "batch_number",
            "production_date",
            "quantity",
        ):
            self.assertEqual(response.data[field], self.payload[field])
        passport = QualityPassport.objects.get(pk=response.data["id"])
        self.assertEqual(passport.created_by_id, self.issuer.pk)
        self.assertEqual(
            QualityPassport.last_issued.get_latest_for_product(self.product), passport
        )
        self.assertEqual(
            QualityPassport.objects.filter(pk=self.previous.pk).values().get(), previous
        )
        item.refresh_from_db()
        self.assertEqual(item.quality_passport_id, self.previous.pk)
        self.assertFalse(passport.order_items.exists())
        self._logger_success(
            "HTTP 201",
            "Previous passport and order assignment preserved",
        )

    def test_rejects_invalid_dates(self) -> None:
        self._logger_header("CATALOG QUALITY PASSPORT: POST INVALID DATES")
        previous_date = self.previous.issue_date.isoformat()
        tomorrow = (self.today + timedelta(days=1)).isoformat()
        cases = (
            (
                "issue_date",
                {"issue_date": previous_date, "production_date": previous_date},
            ),
            ("issue_date", {"issue_date": tomorrow}),
            ("production_date", {"production_date": tomorrow}),
        )
        for field, changes in cases:
            with self.subTest(changes=changes):
                response = self.client.post(
                    self.url, self.payload | changes, format="json"
                )
                self.assertEqual(
                    response.status_code, status.HTTP_400_BAD_REQUEST, response.data
                )
                self.assertIn(field, response.data["errors"])
        self.assertFalse(
            QualityPassport.objects.filter(number=self.payload["number"]).exists()
        )
        self._logger_success(
            "HTTP 400",
            "Invalid dates rejected without issuing a passport",
        )

    def test_rejects_invalid_bulk_quantities(self) -> None:
        self._logger_header("CATALOG QUALITY PASSPORT: POST INVALID BULK QUANTITIES")
        for quantity in ("0.000", "-0.010", "2.0001", "2.005"):
            with self.subTest(quantity=quantity):
                response = self.client.post(
                    self.url, self.payload | {"quantity": quantity}, format="json"
                )
                self.assertEqual(
                    response.status_code, status.HTTP_400_BAD_REQUEST, response.data
                )
                self.assertIn("quantity", response.data["errors"])
        self.assertFalse(
            QualityPassport.objects.filter(number=self.payload["number"]).exists()
        )
        self._logger_success(
            "HTTP 400",
            "Invalid quantities rejected without issuing a passport",
        )

    def test_applies_configured_piece_weight(self) -> None:
        self._logger_header("CATALOG QUALITY PASSPORT: POST PIECE-BASED QUANTITIES")
        product = ProductFactory.create(is_piece_based=True)
        ProductUnitFactory.create(product=product, value=12)
        previous = QualityPassport.objects.create(
            product=product,
            number=54674,
            issue_date=self.previous.issue_date,
            batch_number="29.009",
            production_date=self.previous.production_date,
            quantity=Decimal("0.120"),
        )
        payload = self.payload | {
            "product_id": product.pk,
            "expected_latest_passport_id": previous.pk,
        }

        invalid = self.client.post(
            self.url, payload | {"quantity": "0.037"}, format="json"
        )
        valid = self.client.post(
            self.url, payload | {"quantity": "0.036"}, format="json"
        )

        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST, invalid.data)
        self.assertIn("quantity", invalid.data["errors"])
        self.assertEqual(valid.status_code, status.HTTP_201_CREATED, valid.data)
        self.assertEqual(valid.data["quantity"], "0.036")
        self._logger_success(
            "HTTP 400 / 201",
            "Quantity validated against configured piece weight",
        )

    def test_requires_passport_add_permission(self) -> None:
        self._logger_header("CATALOG QUALITY PASSPORT: POST WITHOUT ADD PERMISSION")
        viewer = get_user_model().objects.create_user(username="passport_viewer")
        viewer.user_permissions.add(
            *Permission.objects.filter(
                content_type__app_label="catalog",
                codename__in=("view_product", "view_qualitypassport"),
            ),
            Permission.objects.get(
                content_type__app_label="order", codename="add_order"
            ),
        )
        self.client.force_authenticate(user=viewer)

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertFalse(
            QualityPassport.objects.filter(number=self.payload["number"]).exists()
        )
        self._logger_success(
            "HTTP 403",
            "Issuance denied without passport add permission",
        )

    def test_returns_not_found_for_missing_product(self) -> None:
        self._logger_header("CATALOG QUALITY PASSPORT: POST FOR A MISSING PRODUCT")
        missing_id = Product.objects.latest("pk").pk + 1

        response = self.client.post(
            self.url, self.payload | {"product_id": missing_id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)
        self._logger_success("HTTP 404", "Missing product rejected")

    def test_rejects_stale_latest_passport_after_another_issuance(self) -> None:
        self._logger_header("CATALOG QUALITY PASSPORT: POST WITH STALE LATEST PASSPORT")
        yesterday = (self.today - timedelta(days=1)).isoformat()
        issued = self.client.post(
            self.url,
            self.payload | {"issue_date": yesterday, "production_date": yesterday},
            format="json",
        )
        self.assertEqual(issued.status_code, status.HTTP_201_CREATED, issued.data)

        stale = self.client.post(
            self.url, self.payload | {"number": 54675}, format="json"
        )

        self.assertEqual(stale.status_code, status.HTTP_409_CONFLICT, stale.data)
        self.assertIn("detail", stale.data["errors"])
        self.assertEqual(
            QualityPassport.last_issued.get_latest_for_product(self.product),
            QualityPassport.objects.get(pk=issued.data["id"]),
        )
        self.assertFalse(QualityPassport.objects.filter(number=54675).exists())
        self._logger_success(
            "HTTP 409",
            "Stale issuance rejected and latest passport preserved",
        )
