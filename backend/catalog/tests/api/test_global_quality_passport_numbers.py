from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from decimal import Decimal
from threading import Barrier
from typing import TYPE_CHECKING, Any
from unittest import skipUnless
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import connection, connections
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase, APITransactionTestCase

from catalog.api.routes import QualityPassportRoutes
from catalog.models import AppUnit, Product, QualityPassport
from catalog.models.quality_passport import MAX_PASSPORT_NUMBER
from catalog.tests.api.factories import ProductFactory, ProductUnitFactory
from catalog.utils.unit_choices import TitleChoices
from order.models import Order, OrderItem
from order.routes import OrderRoutes
from order.tests.factories import OrderFactory, OrderItemFactory

if TYPE_CHECKING:
    from rest_framework.response import _MonkeyPatchedResponse


def bulk_product() -> Product:
    product = ProductFactory.create(is_piece_based=False)
    ton, _ = AppUnit.objects.get_or_create(
        title=TitleChoices.TON, defaults={"is_weight_based": True, "to_kg_factor": 1000}
    )
    ProductUnitFactory.create(product=product, unit=ton, value=1)
    return product


def previous_passport(
    product: Product, number: int, batch: str, days_ago: int
) -> QualityPassport:
    date = timezone.localdate() - timedelta(days=days_ago)
    return QualityPassport.objects.create(
        product=product,
        number=number,
        batch_number=batch,
        issue_date=date,
        production_date=date,
        quantity=Decimal("1.000"),
    )


def issue_payload(
    previous: QualityPassport, number: int, batch: str
) -> dict[str, int | str]:
    today = timezone.localdate().isoformat()
    return {
        "expected_latest_passport_id": previous.pk,
        "number": number,
        "suggested_next_passport_number": number,
        "batch_number": batch,
        "issue_date": today,
        "production_date": today,
        "quantity": "3.000",
    }


class GlobalPassportNumberTests(APITestCase):
    def setUp(self) -> None:
        self.sg = bulk_product()
        self.ep = bulk_product()
        self.client.force_authenticate(
            get_user_model().objects.create_superuser(username="global-passport-issuer")
        )

    def state(self, product: Product, source: str) -> dict[str, Any]:
        response = self.client.get(
            reverse(f"catalog:{QualityPassportRoutes.STATE.name}"),
            {"product_id": str(product.pk), "source": source},
        )
        self.assertEqual(response.status_code, 200, response.data)
        return response.json()

    def catalog_issue(
        self, previous: QualityPassport, payload: dict[str, int | str]
    ) -> _MonkeyPatchedResponse:
        return self.client.post(
            reverse(f"catalog:{QualityPassportRoutes.CREATE.name}"),
            {"product_id": previous.product_id, **payload},
            format="json",
        )

    def order_issue(
        self, item: OrderItem, payload: dict[str, int | str]
    ) -> _MonkeyPatchedResponse:
        return self.client.patch(
            reverse(f"order_orders:{OrderRoutes.DETAIL.name}", args=[item.order_id]),
            {
                "products": [
                    {
                        "product": item.product_id,
                        "quantity": "2.00",
                        "new_quality_passport": payload,
                    }
                ]
            },
            format="json",
        )

    def test_empty_and_integer_limit(self) -> None:
        for source in ("catalog", "order"):
            state = self.state(self.sg, source)
            self.assertEqual(state["suggested_next_passport_number"], 1)
            self.assertIsNone(state["passport"])
        previous_passport(self.ep, MAX_PASSPORT_NUMBER - 1, "12.433", 4)
        self.assertEqual(
            self.state(self.sg, "catalog")["suggested_next_passport_number"],
            MAX_PASSPORT_NUMBER,
        )
        previous_passport(self.ep, MAX_PASSPORT_NUMBER, "12.435", 3)
        for source in ("catalog", "order"):
            self.assertIsNone(
                self.state(self.sg, source)["suggested_next_passport_number"]
            )

    def test_both_issuance_paths_share_the_global_maximum(self) -> None:
        ep = previous_passport(self.ep, 544, "12.433", 5)
        sg = previous_passport(self.sg, 543, "12.432", 3)
        previous_passport(self.ep, 542, "12.431", 4)
        ep_latest = QualityPassport.last_issued.get_latest_for_product(self.ep)
        assert ep_latest is not None
        self.assertNotEqual(ep.pk, ep_latest.pk)

        item = OrderItemFactory.create(
            order=OrderFactory.create(status=Order.Status.CREATED),
            product=self.ep,
            quality_passport=ep_latest,
        )
        for product, source, latest in (
            (self.sg, "catalog", sg),
            (self.ep, "order", ep_latest),
        ):
            state = self.state(product, source)
            self.assertEqual(state["suggested_next_passport_number"], 545)
            self.assertEqual(state["latest_passport_id"], latest.pk)
            self.assertEqual(
                state["passport"]["batch_number"], str(latest.batch_number)
            )

        catalog = self.catalog_issue(sg, issue_payload(sg, 545, "12.433"))
        self.assertEqual(catalog.status_code, 201, catalog.data)
        self.assertEqual(
            self.state(self.ep, "order")["suggested_next_passport_number"], 546
        )
        manual = issue_payload(ep_latest, 545, "12.432")
        manual.pop("suggested_next_passport_number")
        duplicate = self.order_issue(item, manual)
        self.assertEqual(duplicate.status_code, 400, duplicate.data)
        self.assertIn("number", duplicate.json()["errors"]["new_quality_passport"])
        stale = self.order_issue(item, issue_payload(ep_latest, 545, "12.432"))
        self.assertEqual(stale.status_code, 409, stale.data)
        self.assertEqual(stale.json()["errors"]["code"], "passport_number_conflict")
        item.refresh_from_db()
        self.assertEqual(item.quality_passport_id, ep_latest.pk)

        order = self.order_issue(item, issue_payload(ep_latest, 546, "12.432"))
        self.assertEqual(order.status_code, 200, order.data)
        item.refresh_from_db()
        self.assertEqual(item.quality_passport.number, 546)
        self.assertEqual(str(item.quality_passport.batch_number), "12.432")
        state = self.state(self.sg, "catalog")
        self.assertEqual(state["suggested_next_passport_number"], 547)
        self.assertEqual(state["passport"]["batch_number"], "12.433")

    def test_manual_duplicate_has_number_field_error(self) -> None:
        sg = previous_passport(self.sg, 543, "12.432", 3)
        previous_passport(self.ep, 544, "12.433", 3)
        payload = issue_payload(sg, 544, "12.433")
        payload.pop("suggested_next_passport_number")
        response = self.catalog_issue(sg, payload)
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("number", response.json()["errors"])
        self.assertEqual(QualityPassport.objects.count(), 2)

    def test_an_old_suggestion_can_still_be_used_if_the_number_is_free(self) -> None:
        sg = previous_passport(self.sg, 543, "12.432", 3)
        previous_passport(self.ep, 544, "12.433", 3)
        self.assertEqual(
            self.state(self.sg, "catalog")["suggested_next_passport_number"], 545
        )
        previous_passport(self.ep, 550, "12.434", 2)

        response = self.catalog_issue(sg, issue_payload(sg, 545, "12.433"))
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            self.state(self.sg, "catalog")["suggested_next_passport_number"], 551
        )


@skipUnless(
    connection.vendor == "postgresql",
    "Requires PostgreSQL row locking and unique-index concurrency",
)
class GlobalPassportNumberRaceTests(APITransactionTestCase):
    def test_two_products_race_at_the_unique_index(self) -> None:
        url = reverse(f"catalog:{QualityPassportRoutes.CREATE.name}")
        user = get_user_model().objects.create_superuser(
            username="passport-race-issuer"
        )
        passports = [
            previous_passport(bulk_product(), 543, "12.432", 3),
            previous_passport(bulk_product(), 544, "12.433", 3),
        ]
        items = [
            OrderItemFactory.create(product=passport.product, quality_passport=passport)
            for passport in passports
        ]
        barrier = Barrier(2)
        validate_constraints = QualityPassport.validate_constraints

        def synchronize_validation(
            passport: QualityPassport, *args: Any, **kwargs: Any
        ) -> None:
            validate_constraints(passport, *args, **kwargs)
            if passport.number == 545:
                barrier.wait(timeout=10)

        def submit(previous: QualityPassport) -> _MonkeyPatchedResponse:
            try:
                client = APIClient()
                client.force_authenticate(user)
                return client.post(
                    url,
                    {
                        "product_id": previous.product_id,
                        **issue_payload(previous, 545, "12.434"),
                    },
                    format="json",
                )
            finally:
                connections.close_all()

        with patch.object(
            QualityPassport, "validate_constraints", synchronize_validation
        ):
            with ThreadPoolExecutor(max_workers=2) as workers:
                responses = list(workers.map(submit, passports))

        self.assertEqual(
            sorted(response.status_code for response in responses), [201, 409]
        )
        loser = next(
            i for i, response in enumerate(responses) if response.status_code == 409
        )
        self.assertEqual(
            responses[loser].json()["errors"]["code"], "passport_number_conflict"
        )
        self.assertEqual(QualityPassport.objects.filter(number=545).count(), 1)

        self.client.force_authenticate(user)
        previous = passports[loser]
        state = self.client.get(
            reverse(f"catalog:{QualityPassportRoutes.STATE.name}"),
            {"source": "catalog", "product_id": str(previous.product_id)},
        )
        self.assertEqual(state.json()["suggested_next_passport_number"], 546)
        retry = self.client.post(
            url,
            {
                "product_id": previous.product_id,
                **issue_payload(previous, 546, "12.435"),
            },
            format="json",
        )
        self.assertEqual(retry.status_code, 201, retry.data)
        for item, passport in zip(items, passports, strict=True):
            item.refresh_from_db()
            self.assertEqual(item.quality_passport_id, passport.pk)
