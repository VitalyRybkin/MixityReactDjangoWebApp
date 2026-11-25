"""Exercise additional service validation, filtering and permissions."""

from datetime import date
from decimal import Decimal
from typing import cast
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from additional_services.models import AdditionalServiceItem, AdditionalServiceRequest
from additional_services.routes import AdditionalServicesRoutes
from core.tests.authentication_tests import AuthenticationContractMixin
from core.tests.permission_tests import PermissionContractMixin
from core.tests.utils import TestLoggerMixin
from logistic.models import Carrier
from order.models import ConstructionObject, RentalContract
from order.tests.factories import ConstructionObjectFactory
from repairs.models import RepairCompany


class TestAdditionalServicesAPI(
    PermissionContractMixin,
    AuthenticationContractMixin,
    TestLoggerMixin,
    APITestCase,
):
    """Exercise the REST API with authenticated requests and saved fixtures."""

    permission_model = AdditionalServiceRequest

    def setUp(self) -> None:
        """Create an authorized client and related records for each test."""
        super().setUp()
        user_model = get_user_model()
        # Works with custom USERNAME_FIELD as well as Django's default auth.User.
        user = user_model.objects.create(
            **{user_model.USERNAME_FIELD: "additional_services_admin"}
        )
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()
        self.client.force_authenticate(user=user)
        self.url = reverse(
            f"additional_services:{AdditionalServicesRoutes.LIST_CREATE.name}"
        )
        self.obj = cast(ConstructionObject, ConstructionObjectFactory())
        self.other_obj = cast(ConstructionObject, ConstructionObjectFactory())
        self.carrier = Carrier.objects.create(name="Перевозчик А")
        self.company = RepairCompany.objects.create(name="Механики А")
        self.contract = RentalContract.objects.create(
            customer=self.obj.customer,
            contract_date=date(2026, 11, 25),
            contract_number="TEST-AS-1",
            is_active=True,
        )
        self.other_contract = RentalContract.objects.create(
            customer=self.other_obj.customer,
            contract_date=date(2026, 11, 25),
            contract_number="TEST-AS-2",
            is_active=True,
        )

    def item(
        self,
        category: str = "transport",
        name: str = "Работа манипулятора",
        quantity: str = "2.000",
        cost: str = "1000.00",
        price: str = "1500.00",
        rebill: bool = True,
    ) -> dict[str, str | bool]:
        """Build a specification row in the API’s expected format."""
        return dict(
            category=category,
            name=name,
            quantity=quantity,
            cost_per_unit=cost,
            price_per_unit=price,
            is_rebillable=rebill,
        )

    def payload(self, **changes: object) -> dict[str, object]:
        """Build a valid request payload with optional field overrides."""
        data: dict[str, object] = dict(
            direction="site_work",
            status="created",
            service_date="2026-11-25",
            construction_object=self.obj.pk,
            rental_contract=self.contract.pk,
            carrier=self.carrier.pk,
            repair_company=None,
            description="Перестановка силосов",
            items=[self.item()],
        )
        data.update(changes)
        return data

    def create(self, **changes: object) -> Response:
        """Submit a request creation payload to the API."""
        return cast(
            Response,
            self.client.post(self.url, self.payload(**changes), format="json"),
        )

    def test_create_carrier_only_transport(self) -> None:
        """Create a transport request and verify its totals and customer."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.create()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["service_type"], "site_work_carrier")
        self.assertEqual(response.data["composition"], "transport_only")
        self.assertEqual(response.data["totals"]["cost"], "2000.00")
        self.assertEqual(response.data["totals"]["charge"], "3000.00")
        self.assertEqual(response.data["totals"]["margin"], "1000.00")
        self.assertEqual(response.data["customer"], self.obj.customer_id)
        self._logger_success(
            "Carrier transport request created",
            "HTTP 201, customer and totals verified",
        )

    def test_carrier_cannot_have_specialist_items(self) -> None:
        """Reject specialist work assigned to a carrier."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.create(items=[self.item("specialist", name="Работа механика")])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.data["errors"])
        self.assertEqual(AdditionalServiceRequest.objects.count(), 0)
        self._logger_success(
            "Carrier specialist row rejected", "HTTP 400, no request saved"
        )

    def test_repair_company_can_supply_only_specialist_for_site_work(self) -> None:
        """Accept specialist-only site work from a repair company."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.create(
            carrier=None,
            repair_company=self.company.pk,
            items=[self.item("specialist", "Диагностика")],
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["composition"], "specialist_only")
        self.assertEqual(response.data["service_type"], "site_work_repair_company")
        self._logger_success(
            "Repair company request created", "HTTP 201, specialist-only composition"
        )

    def test_repair_company_can_supply_only_transport_for_site_work(self) -> None:
        """Accept transport-only site work from a repair company."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.create(carrier=None, repair_company=self.company.pk)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["composition"], "transport_only")
        self._logger_success(
            "Repair company request created", "HTTP 201, transport-only composition"
        )

    def test_company_can_supply_both_blocks_and_charge_independently(self) -> None:
        """Total both categories while charging only rebillable work."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.create(
            carrier=None,
            repair_company=self.company.pk,
            items=[
                self.item(),
                self.item(
                    "specialist", "Монтаж", "1.000", "2000.00", "3500.00", rebill=False
                ),
            ],
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["composition"], "both")
        totals = response.data["totals"]
        self.assertEqual(totals["cost"], "4000.00")
        self.assertEqual(totals["charge"], "3000.00")
        self.assertEqual(totals["by_category"]["specialist"]["charge"], "0.00")
        self.assertEqual(totals["margin"], "-1000.00")
        self._logger_success(
            "Both categories included in totals", "Only rebillable work charged"
        )

    def test_delivery_and_return_require_transport_even_for_repair_company(
        self,
    ) -> None:
        """Require a transport row for both delivery and return requests."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        for direction in ("delivery", "return"):
            with self.subTest(direction=direction):
                response = self.create(
                    direction=direction,
                    carrier=None,
                    repair_company=self.company.pk,
                    items=[self.item("specialist")],
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("items", response.data["errors"])
        self._logger_success(
            "Delivery and return without transport rejected",
            "HTTP 400 for both directions",
        )

    def test_carrier_requires_exactly_one_provider(self) -> None:
        """Reject requests with either zero or two providers."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        for providers in (
            {"carrier": None, "repair_company": None},
            {"carrier": self.carrier.pk, "repair_company": self.company.pk},
        ):
            with self.subTest(providers=providers):
                response = self.create(**providers)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self._logger_success(
            "Invalid provider combinations rejected",
            "HTTP 400 for zero or two providers",
        )

    def test_contract_must_match_construction_object_customer(self) -> None:
        """Reject a rental contract belonging to another customer."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.create(rental_contract=self.other_contract.pk)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rental_contract", response.data["errors"])
        self._logger_success("Contract from another customer rejected", "HTTP 400")

    def test_contract_is_optional_for_work_at_site(self) -> None:
        """Accept site work without a linked rental contract."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.create(rental_contract=None)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNone(response.data["rental_contract"])
        self._logger_success("Site work created without a contract", "HTTP 201")

    def test_missing_items_and_zero_quantity_rejected(self) -> None:
        """Reject empty specifications and rows with zero quantity."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        self.assertEqual(self.create(items=[]).status_code, status.HTTP_400_BAD_REQUEST)
        response = self.create(items=[self.item(quantity="0.000")])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.data["errors"])
        self._logger_success(
            "Invalid specifications rejected",
            "HTTP 400 for empty items and zero quantity",
        )

    def test_update_specification_replaces_all_items(self) -> None:
        """Replace all saved rows when a new specification is supplied."""
        record = self.create()
        self.assertEqual(record.status_code, status.HTTP_201_CREATED)
        pk = record.data["id"]
        url = reverse(
            f"additional_services:{AdditionalServicesRoutes.DETAIL.name}",
            kwargs={"pk": pk},
        )
        self._logger_header(f"ENDPOINT PATCH: {url}")
        response = cast(
            Response,
            self.client.patch(
                url,
                {"items": [self.item(quantity="3.000", rebill=False)]},
                format="json",
            ),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["totals"]["cost"], "3000.00")
        self.assertEqual(response.data["totals"]["charge"], "0.00")
        self.assertEqual(AdditionalServiceItem.objects.filter(request_id=pk).count(), 1)
        self._logger_success(
            "Specification replaced", "HTTP 200, replacement row and totals verified"
        )

    def test_failed_specification_replacement_rolls_back_request_and_items(
        self,
    ) -> None:
        """Restore the request and its original rows when replacement insertion fails."""
        record = self.create(
            items=[self.item(), self.item(name="Second transport row")]
        )
        self.assertEqual(record.status_code, status.HTTP_201_CREATED, record.data)
        pk = record.data["id"]
        url = reverse(
            f"additional_services:{AdditionalServicesRoutes.DETAIL.name}",
            kwargs={"pk": pk},
        )
        service_request = AdditionalServiceRequest.objects.get(pk=pk)
        original_description = service_request.description
        items = AdditionalServiceItem.objects.filter(request_id=pk).order_by(
            "sort_order"
        )
        original_items = list(items.values())
        updated_description = "Replacement in progress"
        manager = AdditionalServiceItem.objects
        bulk_create = manager.bulk_create

        def insert_invalid_replacement(
            replacements: list[AdditionalServiceItem],
        ) -> list[AdditionalServiceItem]:
            """Trigger the quantity constraint after the update and deletion."""
            service_request.refresh_from_db()
            self.assertEqual(service_request.description, updated_description)
            self.assertFalse(items.exists())
            replacements[0].quantity = Decimal("0")
            return bulk_create(replacements)

        self._logger_header(f"PATCH {url}: specification replacement rollback")
        with (
            patch.object(
                manager, "bulk_create", side_effect=insert_invalid_replacement
            ),
            self.assertLogs("core.api.exceptions", level="ERROR") as errors,
            self.assertLogs("django.request", level="ERROR"),
        ):
            response = self.client.patch(
                url,
                {"description": updated_description, "items": [self.item()]},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertTrue(
            any(
                entry.exc_info and isinstance(entry.exc_info[1], IntegrityError)
                for entry in errors.records
            ),
            "\n".join(errors.output),
        )
        service_request.refresh_from_db()
        self.assertEqual(service_request.description, original_description)
        self.assertEqual(list(items.values()), original_items)
        self._logger_success(
            "Specification replacement rolled back",
            "Original request description and both saved items restored",
        )

    def test_patch_without_items_preserves_specification(self) -> None:
        """Preserve existing rows when a PATCH omits the specification."""
        record = self.create()
        url = reverse(
            f"additional_services:{AdditionalServicesRoutes.DETAIL.name}",
            kwargs={"pk": record.data["id"]},
        )
        self._logger_header(f"ENDPOINT PATCH: {url}")
        response = cast(
            Response,
            self.client.patch(url, {"description": "Новый комментарий"}, format="json"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["totals"]["cost"], "2000.00")
        self._logger_success(
            "Specification preserved", "HTTP 200, original item and cost retained"
        )

    def test_cannot_switch_company_to_carrier_with_specialist_remaining(self) -> None:
        """Require replacement of specialist rows when switching to a carrier."""
        record = self.create(
            carrier=None,
            repair_company=self.company.pk,
            items=[self.item("specialist")],
        )
        self.assertEqual(record.status_code, status.HTTP_201_CREATED)
        url = reverse(
            f"additional_services:{AdditionalServicesRoutes.DETAIL.name}",
            kwargs={"pk": record.data["id"]},
        )
        self._logger_header(f"ENDPOINT PATCH: {url}")
        invalid = self.client.patch(
            url,
            {
                "carrier": self.carrier.pk,
                "repair_company": None,
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        valid = cast(
            Response,
            self.client.patch(
                url,
                {
                    "carrier": self.carrier.pk,
                    "repair_company": None,
                    "items": [self.item()],
                },
                format="json",
            ),
        )
        self.assertEqual(valid.status_code, status.HTTP_200_OK, valid.data)
        self.assertEqual(valid.data["provider_type"], "carrier")
        self._logger_success(
            "Provider switch validated",
            "HTTP 400 with specialist rows, HTTP 200 after replacement",
        )

    def test_filter_exact_type_direction_provider_and_composition(self) -> None:
        """Verify repeated filters and matching by service and item attributes."""
        self._logger_header(f"ENDPOINT GET: {self.url}")
        a = self.create(direction="delivery")
        b = self.create(direction="return")
        c = self.create(
            carrier=None,
            repair_company=self.company.pk,
            items=[self.item("specialist", name="Диагностика")],
        )
        self.assertTrue(
            all(x.status_code == status.HTTP_201_CREATED for x in (a, b, c))
        )
        for query, expected in (
            ("direction=delivery", [a.data["id"]]),
            ("provider_type=carrier", [a.data["id"], b.data["id"]]),
            ("composition=specialist_only", [c.data["id"]]),
            ("item_category=specialist", [c.data["id"]]),
            ("item_name=манипулятора", [a.data["id"], b.data["id"]]),
            ("service_type=site_work_repair_company", [c.data["id"]]),
            ("direction=delivery&direction=return", [a.data["id"], b.data["id"]]),
            (
                "service_type=delivery_carrier&service_type=return_carrier",
                [a.data["id"], b.data["id"]],
            ),
        ):
            with self.subTest(query=query):
                response = cast(Response, self.client.get(f"{self.url}?{query}"))
                self.assertEqual(
                    response.status_code, status.HTTP_200_OK, response.data
                )
                self.assertEqual(
                    {row["id"] for row in response.data["results"]}, set(expected)
                )
        self._logger_success(
            "Service filters returned the expected requests",
            "Individual and repeated filters verified",
        )

    def test_rejects_invalid_filter(self) -> None:
        """Return a field error for an unknown filter value."""
        self._logger_header(f"ENDPOINT GET: {self.url}")
        response = cast(Response, self.client.get(f"{self.url}?composition=invalid"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("composition", response.data["errors"])
        self._logger_success("Unknown composition rejected", "HTTP 400")

    def test_post_without_add_permission_returns_403(self) -> None:
        """Require add permission to create a service request."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        user = get_user_model().objects.create_user(
            username="additional_services_unprivileged",
            password="test_password",
        )
        self.client.force_authenticate(user=user)
        self.assertEqual(self.create().status_code, status.HTTP_403_FORBIDDEN)
        self._logger_success("Creation denied without add permission", "HTTP 403")
