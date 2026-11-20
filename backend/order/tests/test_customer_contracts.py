from datetime import date
from typing import Any

from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework import status
from rest_framework.reverse import reverse

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import TestLoggerMixin
from order.models import Customer, RentalContract
from order.routes import RentalContractsRoutes
from order.tests.factories import CustomerFactory, RentalContractFactory


class TestCustomerContractsAPIList(
    BaseAPIMixin,
):
    """Check listing and creating rental contracts under a customer."""

    __test__ = True
    model = RentalContract
    factory = RentalContractFactory
    pk_url_name = f"order_customers:{RentalContractsRoutes.LIST_CREATE.name}"

    def _get_parent(self) -> Customer:
        return self.obj.customer

    def get_url_kwargs(self) -> dict[str, int]:
        return {"pk": self.obj.customer_id}

    def _assert_create_for_customer_returns_404(
        self,
        customer_id: int,
        case: str,
    ) -> None:
        url = reverse(
            self.pk_url_name,
            kwargs={"pk": customer_id},
        )

        self._logger_header(f"ENDPOINT POST: {url}")

        payload = {
            "contract_date": "2026-12-01",
            "contract_number": "12345",
        }

        count_before = RentalContract.objects.count()

        response = self.client.post(
            url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            RentalContract.objects.count(),
            count_before,
        )

        self._logger_success(
            case,
            f"HTTP {response.status_code}",
        )

    def test_inactive_parent_returns_404(self) -> None:
        self._inactive_parent_visibility_logic()

    def test_nonexistent_parent_returns_404(self) -> None:
        self._nonexistent_parent_visibility_logic()

    def test_get_customer_rental_contracts(self) -> None:
        customer = CustomerFactory.create()
        contracts = self.factory.create_batch(
            3,
            customer=customer,
            is_active=False,
        )
        self.factory.create(
            customer=CustomerFactory.create(),
            is_active=True,
        )
        contracts.append(
            self.factory.create(
                customer=customer,
                is_active=True,
            )
        )

        self._get_object_related_entities_list(
            customer.id,
            contracts,
            entity="rental_contracts",
        )

    def test_creating_item_logic(self) -> None:
        """Check that the list endpoint creates a rental contract."""
        payload = self.payload_generator()
        self._create_logic(payload, pk=payload["customer"])

    def test_contracts_are_ordered_by_date_then_id(self) -> None:
        """List the newest dates first and resolve date ties by descending ID."""
        customer = self.obj.customer
        latest = self.factory.create(
            customer=customer, contract_date=date(2026, 12, 1), is_active=False,
        )
        tied = self.factory.create(
            customer=customer, contract_date=latest.contract_date, is_active=False,
        )
        earliest = self.factory.create(
            customer=customer, contract_date=date(2026, 1, 1), is_active=False,
        )
        self.obj.contract_date = date(2026, 6, 1)
        self.obj.save(update_fields=["contract_date"])
        self._logger_header(f"ENDPOINT GET: {self.url}")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [contract["id"] for contract in response.data],
            [tied.id, latest.id, self.obj.id, earliest.id],
        )
        self._logger_success("Contract history retrieved", "Date and ID ordering verified")

    def test_str_method(self) -> None:
        """Check that the contract label includes the customer, number, and date."""
        contract = self.obj
        self._str_method_logic(
            f"{contract.customer.name} - №{contract.contract_number} от "
            f"{contract.contract_date:%d.%m.%Y}"
        )

    def test_new_active_contract_deactivates_previous(self) -> None:
        """POST defaults to active and assigns the customer from the URL."""
        previous = self.obj
        other = self.factory.create()
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.client.post(
            self.url,
            data={
                "customer": other.customer_id,
                "contract_date": "2026-12-01",
                "contract_number": "12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        current = RentalContract.objects.get(pk=response.data["id"])
        previous.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(current.customer_id, previous.customer_id)
        self.assertFalse(previous.is_active)
        self.assertTrue(current.is_active)
        self.assertTrue(other.is_active)

        self._logger_success(
            "New active contract created | HTTP 201",
            "Previous contract deactivated",
        )

    def payload_generator(self) -> dict[str, Any]:
        """Build an inactive contract payload for the test customer."""
        return {
            "customer": self.obj.customer_id,
            "contract_date": self.obj.contract_date,
            "contract_number": "12345",
            "is_active": False,
        }

    def test_inactive_create_preserves_active_contract(self) -> None:
        """Creating contract history leaves the active contract in place."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        response = self.client.post(self.url, self.payload_generator(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["is_active"])
        self.obj.refresh_from_db()
        self.assertTrue(self.obj.is_active)
        self._logger_success("Inactive contract created", "Active contract preserved")

    def test_create_rejects_invalid_date_and_number(self) -> None:
        """Validate contract fields before changing the active contract."""
        self._logger_header(f"ENDPOINT POST: {self.url}")
        for field, invalid_value in [
            ("contract_date", "invalid"),
            ("contract_number", "1" * 21),
        ]:
            with self.subTest(field=field):
                payload = self.payload_generator()
                payload.update({"is_active": True, field: invalid_value})
                response = self.client.post(self.url, payload, format="json")

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data["errors"])

        self.assertEqual(RentalContract.objects.count(), 1)
        self.obj.refresh_from_db()
        self.assertTrue(self.obj.is_active)
        self._logger_success("Invalid contract data rejected", "HTTP 400")

    def test_create_for_inactive_customer_returns_404(self) -> None:
        customer = CustomerFactory.create(is_active=False)

        self._assert_create_for_customer_returns_404(
            customer.id,
            "Inactive customer rejected",
        )

    def test_create_for_nonexistent_customer_returns_404(self) -> None:
        self._assert_create_for_customer_returns_404(
            999999,
            "Nonexistent customer rejected",
        )


class TestCustomerRentalContractAPIDetailAPI(
    BaseAPIMixin,
):
    """Check detail operations and ownership of customer rental contracts."""

    __test__ = True
    pk_url_name = f"order_customers:{RentalContractsRoutes.DETAIL.name}"
    factory = RentalContractFactory

    permission_model = RentalContract

    def _get_parent(self) -> Customer:
        return self.obj.customer

    def _get_parent_url_kwargs(
        self,
        parent_pk: int,
    ) -> dict[str, int]:
        return {
            "pk": parent_pk,
            "contract_pk": self.obj.id,
        }

    def get_url_kwargs(self) -> dict[str, int]:
        """Return the customer and rental contract IDs for the detail URL."""
        return self._get_parent_url_kwargs(self.obj.customer_id)

    def test_inactive_parent_returns_404(self) -> None:
        self._inactive_parent_visibility_logic()

    def test_nonexistent_parent_returns_404(self) -> None:
        self._nonexistent_parent_visibility_logic()

    def test_retrieve_logic(self) -> None:
        """Test the logic for retrieving a rental contract."""
        self._retrieve_object_by_id(
            obj=self.obj,
            pk=self.obj.customer.id,
            contract_pk=self.obj.id,
        )

    def test_contract_from_another_customer_returns_404(self) -> None:
        """Test the logic for retrieving a rental contract from another customer."""

        self._logger_header("ENDPOINT GET: retrieve rental contract from another customer")
        another_customer = CustomerFactory.create()

        url = reverse(
            self.pk_url_name,
            kwargs={
                "pk": another_customer.id,
                "contract_pk": self.obj.id,
            },
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self._logger_success(
            "Rental contract from another customer rejected | HTTP 404",
            "",
        )

    def test_inactive_rental_contract_returns_200(self) -> None:
        self._logger_header(
            "ENDPOINT GET: retrieve inactive rental contract",
        )
        self.obj.is_active = False
        self.obj.save(update_fields=["is_active"])

        url = reverse(
            self.pk_url_name,
            kwargs=self.get_url_kwargs(),
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.obj.id)
        self.assertFalse(response.data["is_active"])
        self._logger_success(
            "Inactive rental contract retrieved | HTTP 200",
            msg="",
        )

    def test_patch_reactivates_inactive_contract(self) -> None:
        """Activating an older contract retires the currently active contract."""
        current = self.factory.create(customer=self.obj.customer)
        self._logger_header(f"ENDPOINT PATCH: {self.url}")

        response = self.client.patch(self.url, {"is_active": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_active"])
        self.obj.refresh_from_db()
        current.refresh_from_db()
        self.assertTrue(self.obj.is_active)
        self.assertFalse(current.is_active)
        self._logger_success("Contract reactivated", "Previous active contract retired")

    def test_delete_active_contract_preserves_inactive_history(self) -> None:
        """Deleting the active contract leaves historical contracts inactive."""
        historical = self.factory.create(customer=self.obj.customer, is_active=False)
        self._logger_header(f"ENDPOINT DELETE: {self.url}")

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RentalContract.objects.filter(pk=self.obj.pk).exists())
        historical.refresh_from_db()
        self.assertFalse(historical.is_active)
        self._logger_success("Active contract deleted", "Inactive history preserved")


class TestRentalContractModel(TestCase, TestLoggerMixin):
    """Check persistence rules shared by API and direct model saves."""

    def test_metadata_only_save_preserves_active_contract(self) -> None:
        """A stale instance can edit metadata without retiring its replacement."""
        previous = RentalContractFactory.create()
        current = RentalContractFactory.create(customer=previous.customer)
        self._logger_header("METHOD: save rental contract metadata")

        previous.contract_number = "updated"
        previous.save(update_fields=["contract_number"])

        previous.refresh_from_db()
        current.refresh_from_db()
        self.assertEqual(previous.contract_number, "updated")
        self.assertFalse(previous.is_active)
        self.assertTrue(current.is_active)
        self._logger_success("Contract metadata updated", "Active contract preserved")

    def test_active_only_save_uses_persisted_customer(self) -> None:
        """Scope a partial activation to the customer stored for that contract."""
        previous = RentalContractFactory.create()
        current = RentalContractFactory.create(customer=previous.customer)
        other = RentalContractFactory.create()
        self._logger_header("METHOD: save rental contract activation")

        previous.customer = other.customer
        previous.save(update_fields=["is_active"])

        previous.refresh_from_db()
        current.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(previous.customer_id, current.customer_id)
        self.assertTrue(previous.is_active)
        self.assertFalse(current.is_active)
        self.assertTrue(other.is_active)
        self._logger_success("Contract reactivated", "Persisted customer used")

    def test_customer_only_save_uses_persisted_active_status(self) -> None:
        """Moving an active contract retires the destination's active contract."""
        moving = RentalContractFactory.create()
        destination = RentalContractFactory.create()
        self._logger_header("METHOD: save rental contract customer")

        moving.customer_id = destination.customer_id
        moving.is_active = False
        moving.save(update_fields=["customer_id"])

        moving.refresh_from_db()
        destination.refresh_from_db()
        self.assertEqual(moving.customer_id, destination.customer_id)
        self.assertTrue(moving.is_active)
        self.assertFalse(destination.is_active)
        self._logger_success("Active contract moved", "Persisted active status used")

    def test_failed_insert_rolls_back_deactivation(self) -> None:
        """Keep the current contract active when the replacement fails to save."""
        current = RentalContractFactory.create()
        other = RentalContractFactory.create()
        duplicate = RentalContractFactory.build(pk=other.pk, customer=current.customer)
        self._logger_header("METHOD: rollback failed rental contract insert")

        with self.assertRaises(IntegrityError):
            duplicate.save(force_insert=True)

        current.refresh_from_db()
        self.assertTrue(current.is_active)
        self._logger_success("Duplicate primary key rejected", "Active contract preserved")

    def test_database_rejects_second_active_contract(self) -> None:
        """Enforce the active limit on writes that bypass the save method."""
        current = RentalContractFactory.create()
        historical = RentalContractFactory.create(customer=current.customer, is_active=False)
        self._logger_header("CONSTRAINT: one active rental contract per customer")

        with self.assertRaises(IntegrityError), transaction.atomic():
            RentalContract.objects.filter(pk=historical.pk).update(is_active=True)

        historical.refresh_from_db()
        self.assertFalse(historical.is_active)
        self._logger_success("Second active contract rejected", "Database constraint enforced")
