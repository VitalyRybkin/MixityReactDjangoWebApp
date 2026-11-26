from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITransactionTestCase

from catalog.models import QualityPassport
from catalog.services.quality_passport_issue import QualityPassportIssueService
from catalog.tests.api.test_global_quality_passport_numbers import (
    bulk_product,
    issue_payload,
    previous_passport,
)
from core.tests.utils import TestLoggerMixin
from order.models import Order
from order.routes import OrderRoutes
from order.tests.factories import OrderFactory, OrderItemFactory

if TYPE_CHECKING:
    from rest_framework.response import _MonkeyPatchedResponse


class MultipleOrderPassportIssuanceTests(TestLoggerMixin, APITransactionTestCase):
    def setUp(self) -> None:
        self.client.force_authenticate(
            get_user_model().objects.create_superuser(username="multi-passport-issuer")
        )
        self.order = OrderFactory.create(status=Order.Status.CREATED)
        self.sg = bulk_product()
        self.ep = bulk_product()
        historical_product = bulk_product()
        self.sg_passport = previous_passport(self.sg, 543, "12.432", 3)
        self.ep_passport = previous_passport(self.ep, 544, "29.009", 3)
        self.historical = previous_passport(historical_product, 542, "20.000", 4)
        previous_passport(historical_product, 541, "20.001", 3)
        self.items = [
            OrderItemFactory.create(
                order=self.order, product=passport.product, quality_passport=passport
            )
            for passport in (self.sg_passport, self.ep_passport, self.historical)
        ]

    def submit(self) -> _MonkeyPatchedResponse:
        return self.client.patch(
            reverse(f"order_orders:{OrderRoutes.DETAIL.name}", args=[self.order.pk]),
            {
                "description": "Updated order",
                "products": [
                    {
                        "product": self.sg.pk,
                        "quantity": "2.00",
                        "new_quality_passport": issue_payload(
                            self.sg_passport, 545, "12.433"
                        ),
                    },
                    {
                        "product": self.ep.pk,
                        "quantity": "2.00",
                        "new_quality_passport": issue_payload(
                            self.ep_passport, 546, "29.010"
                        ),
                    },
                    {"product": self.historical.product_id, "quantity": "1.00"},
                ],
            },
            format="json",
        )

    def test_assigns_two_new_passports_and_preserves_the_historical_link(self) -> None:
        self._logger_header(
            "ORDER MULTIPLE PASSPORT ISSUANCE: "
            "ASSIGNS TWO NEW PASSPORTS AND PRESERVES THE HISTORICAL LINK"
        )
        response = self.submit()
        self.assertEqual(response.status_code, 200, response.data)

        for item, (number, batch) in zip(
            self.items, [(545, "12.433"), (546, "29.010"), (542, "20.000")], strict=True
        ):
            item.refresh_from_db()
            self.assertEqual(item.quality_passport.product_id, item.product_id)
            self.assertEqual(item.quality_passport.number, number)
            self.assertEqual(str(item.quality_passport.batch_number), batch)
        self.assertEqual(self.items[2].quality_passport_id, self.historical.pk)
        self._logger_success(
            "Assigns two new passports and preserves the historical link",
            "Both new passports persisted and the historical link was preserved",
        )

    def test_rolls_back_the_first_passport_when_the_second_number_is_taken(
        self,
    ) -> None:
        self._logger_header(
            "ORDER MULTIPLE PASSPORT ISSUANCE: "
            "ROLLS BACK THE FIRST PASSPORT WHEN THE SECOND NUMBER IS TAKEN"
        )
        competitor = previous_passport(bulk_product(), 546, "12.433", 2)
        original_description = self.order.description
        original_links = [item.quality_passport_id for item in self.items]
        successful_numbers = []
        issue = QualityPassportIssueService.issue

        def record_success(**kwargs: Any) -> QualityPassport:
            passport = issue(**kwargs)
            successful_numbers.append(passport.number)
            return passport

        with patch.object(
            QualityPassportIssueService, "issue", side_effect=record_success
        ):
            response = self.submit()

        self.assertEqual(response.status_code, 409, response.data)
        self.assertEqual(response.json()["errors"]["code"], "passport_number_conflict")
        self.assertEqual(successful_numbers, [545])
        self.assertFalse(QualityPassport.objects.filter(number=545).exists())
        self.assertEqual(QualityPassport.objects.get(number=546).pk, competitor.pk)
        self.order.refresh_from_db()
        self.assertEqual(self.order.description, original_description)
        for item, passport_id in zip(self.items, original_links, strict=True):
            item.refresh_from_db()
            self.assertEqual(item.quality_passport_id, passport_id)
            self.assertEqual(item.weight_quantity, Decimal("1.00"))
        self._logger_success(
            "Rolls back the first passport when the second number is taken",
            "Failed issuance preserved both original order links",
        )
