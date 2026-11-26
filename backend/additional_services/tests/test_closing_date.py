"""Closing date API coverage for AdditionalServiceRequest.

Open requests have no closing date. Closing fills a date; reopening clears it.
"""

from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from additional_services.models import AdditionalServiceRequest
from additional_services.routes import AdditionalServicesRoutes
from core.tests.utils import TestLoggerMixin
from logistic.models import Carrier
from order.models import RentalContract
from order.tests.factories import ConstructionObjectFactory


class TestAdditionalServiceClosingDate(TestLoggerMixin, APITestCase):
    def setUp(self) -> None:
        user_model = get_user_model()
        user = user_model.objects.create(
            **{user_model.USERNAME_FIELD: "additional_services_closing_test"}
        )
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()
        self.client.force_authenticate(user=user)

        self.object = ConstructionObjectFactory.create()
        self.carrier = Carrier.objects.create(name="Перевозчик для теста дат")
        self.contract = RentalContract.objects.create(
            customer=self.object.customer,
            contract_date=date(2026, 11, 25),
            contract_number="TEST-AS-CLOSING",
            is_active=True,
        )
        self.url = reverse(
            f"additional_services:{AdditionalServicesRoutes.LIST_CREATE.name}"
        )

    def payload(self, **overrides: object) -> dict[str, object]:
        data: dict[str, object] = {
            "service_date": "2026-11-25",
            "direction": "site_work",
            "status": "open",
            "construction_object": self.object.pk,
            "rental_contract": self.contract.pk,
            "carrier": self.carrier.pk,
            "repair_company": None,
            "description": "Перестановка силоса",
            "items": [
                {
                    "category": "transport",
                    "name": "Работа манипулятора",
                    "quantity": "1.000",
                    "cost_per_unit": "1000.00",
                    "price_per_unit": "1200.00",
                    "is_rebillable": True,
                }
            ],
        }
        data.update(overrides)
        return data

    def detail_url(self, pk: int) -> str:
        return reverse(
            f"additional_services:{AdditionalServicesRoutes.DETAIL.name}",
            kwargs={"pk": pk},
        )

    def test_create_without_closing_date_is_allowed(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: POST OPEN REQUEST WITHOUT A CLOSING DATE"
        )
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data["closing_date"])
        self.assertIsNone(
            AdditionalServiceRequest.objects.get(pk=response.data["id"]).closing_date
        )
        self._logger_success("HTTP 201", "Open request stored without a closing date")

    def test_create_and_read_closing_date(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: POST AND GET A CLOSED REQUEST"
        )
        response = self.client.post(
            self.url,
            self.payload(status="closed", closing_date="2026-11-26"),
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["closing_date"], "2026-11-26")
        detail = self.client.get(self.detail_url(response.data["id"]))
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertEqual(detail.data["closing_date"], "2026-11-26")
        self._logger_success("HTTP 201 / 200", "Explicit closing date persisted")

    def test_patch_closing_date_without_replacing_items(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: PATCH CLOSING AND REOPENING"
        )
        created = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(created.status_code, 201, created.data)
        pk = created.data["id"]
        item_ids = list(
            AdditionalServiceRequest.objects.get(pk=pk).items.values_list(
                "id", flat=True
            )
        )
        changed = self.client.patch(
            self.detail_url(pk),
            {"status": "closed", "closing_date": "2026-11-27"},
            format="json",
        )
        self.assertEqual(changed.status_code, 200, changed.data)
        self.assertEqual(changed.data["closing_date"], "2026-11-27")
        self.assertEqual(
            list(
                AdditionalServiceRequest.objects.get(pk=pk).items.values_list(
                    "id", flat=True
                )
            ),
            item_ids,
        )
        reopened = self.client.patch(
            self.detail_url(pk), {"status": "open"}, format="json"
        )
        self.assertEqual(reopened.status_code, 200, reopened.data)
        self.assertIsNone(reopened.data["closing_date"])
        self.assertEqual(reopened.data["status"], "open")
        self._logger_success(
            "HTTP 200",
            "Items preserved on close and closing date cleared on reopen",
        )

    def test_invalid_date_is_rejected(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: POST INVALID CLOSING DATE"
        )
        response = self.client.post(
            self.url, self.payload(closing_date="not-a-date"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(AdditionalServiceRequest.objects.count(), 0)
        self._logger_success(
            "HTTP 400",
            "Invalid date rejected without creating a request",
        )

    def test_closing_status_without_date_prefills_today(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: PATCH STATUS TO CLOSED WITHOUT A DATE"
        )
        from django.utils import timezone

        created = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(created.status_code, 201, created.data)
        closed = self.client.patch(
            self.detail_url(created.data["id"]), {"status": "closed"}, format="json"
        )
        self.assertEqual(closed.status_code, 200, closed.data)
        self.assertEqual(closed.data["status"], "closed")
        self.assertEqual(closed.data["closing_date"], timezone.localdate().isoformat())
        self._logger_success("HTTP 200", "Closing date defaulted to today")

    def test_open_request_cannot_have_a_closing_date(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: POST OPEN REQUEST WITH A CLOSING DATE"
        )
        response = self.client.post(
            self.url,
            self.payload(status="open", closing_date="2026-11-26"),
            format="json",
        )
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(AdditionalServiceRequest.objects.count(), 0)
        self._logger_success("HTTP 400", "Open request with a closing date rejected")

    def test_cannot_explicitly_clear_date_of_closed_request(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: PATCH CLOSING DATE TO NULL ON A CLOSED REQUEST"
        )
        created = self.client.post(
            self.url, self.payload(status="closed"), format="json"
        )
        self.assertEqual(created.status_code, 201, created.data)
        cleared = self.client.patch(
            self.detail_url(created.data["id"]), {"closing_date": None}, format="json"
        )
        self.assertEqual(cleared.status_code, 400, cleared.data)
        self._logger_success("HTTP 400", "Closing date clearing rejected")

    def test_closed_date_can_be_adjusted_without_resaving_items(self) -> None:
        self._logger_header(
            "ADDITIONAL SERVICE CLOSING DATE: PATCH CLOSING DATE ON A CLOSED REQUEST"
        )
        created = self.client.post(
            self.url, self.payload(status="closed"), format="json"
        )
        self.assertEqual(created.status_code, 201, created.data)
        ids_before = list(
            AdditionalServiceRequest.objects.get(
                pk=created.data["id"]
            ).items.values_list("id", flat=True)
        )
        updated = self.client.patch(
            self.detail_url(created.data["id"]),
            {"closing_date": "2026-11-28"},
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data["closing_date"], "2026-11-28")
        self.assertEqual(
            list(
                AdditionalServiceRequest.objects.get(
                    pk=created.data["id"]
                ).items.values_list("id", flat=True)
            ),
            ids_before,
        )
        self._logger_success("HTTP 200", "Closing date updated and items preserved")
