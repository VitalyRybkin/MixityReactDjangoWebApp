"""Rental-contract rules for the existing two-location Repairs workflow."""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from core.tests.utils import TestLoggerMixin
from order.tests.factories import (
    ConstructionObjectFactory,
    CustomerFactory,
    RentalContractFactory,
)
from repairs.models.repair_request_models import RepairRequest
from repairs.serializers.repair_request_serializers import (
    RepairRequestReadSerializer,
    RepairRequestWriteSerializer,
)


class TestRepairRentalContract(TestCase, TestLoggerMixin):
    def setUp(self) -> None:
        self.customer = CustomerFactory.create()
        self.object = ConstructionObjectFactory.create(customer=self.customer)
        self.contract = RentalContractFactory.create(customer=self.customer)
        self.repair = RepairRequest.objects.create(
            construction_object=self.object,
            rental_contract=self.contract,
            location=RepairRequest.Location.SITE,
        )

    def test_new_repair_requires_rental_contract(self) -> None:
        self._logger_header("REPAIR REQUEST: REQUIRE A RENTAL CONTRACT")
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({"construction_object": self.object})
        self.assertIn("rental_contract", raised.exception.detail)
        self._logger_success("rental_contract", "Missing contract rejected")

    def test_contract_from_other_customer_is_rejected(self) -> None:
        self._logger_header("REPAIR REQUEST: CONTRACT FROM ANOTHER CUSTOMER")
        other = RentalContractFactory.create(customer=CustomerFactory.create())
        serializer = RepairRequestWriteSerializer(instance=self.repair, partial=True)
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({"rental_contract": other})
        self.assertIn("rental_contract", raised.exception.detail)
        self._logger_success("rental_contract", "Another customer's contract rejected")

    def test_contract_and_object_same_customer_is_valid(self) -> None:
        self._logger_header("REPAIR REQUEST: CONTRACT AND OBJECT SHARE A CUSTOMER")
        serializer = RepairRequestWriteSerializer()
        attrs = {"construction_object": self.object, "rental_contract": self.contract}
        self.assertEqual(serializer.validate(attrs), attrs)
        self._logger_success("rental_contract", "Matching contract and object accepted")

    def test_after_return_requires_workshop(self) -> None:
        self._logger_header("REPAIR REQUEST: AFTER RETURN REQUIRES WORKSHOP")
        serializer = RepairRequestWriteSerializer(instance=self.repair, partial=True)
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({"is_after_return": True})
        self.assertIn("is_after_return", raised.exception.detail)
        self._logger_success(
            "is_after_return", "After-return repair at the site rejected"
        )

    def test_workshop_after_return_is_valid(self) -> None:
        self._logger_header("REPAIR REQUEST: WORKSHOP AFTER RETURN")
        serializer = RepairRequestWriteSerializer(
            instance=self.repair,
            data={"is_after_return": True, "location": RepairRequest.Location.WORKSHOP},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.repair.refresh_from_db()
        self.assertTrue(self.repair.is_after_return)
        self.assertEqual(self.repair.location, RepairRequest.Location.WORKSHOP)
        self.assertEqual(self.repair.status, RepairRequest.Status.OPEN)
        self._logger_success(
            "is_after_return", "Workshop repair saved with open status"
        )

    def test_unrelated_patch_to_legacy_repair_is_allowed(self) -> None:
        self._logger_header("REPAIR REQUEST: UPDATE A LEGACY REPAIR WITHOUT A CONTRACT")
        self.repair.rental_contract = None
        self.repair.save(update_fields=["rental_contract"])
        serializer = RepairRequestWriteSerializer(
            instance=self.repair,
            data={"description": "Исправлено описание"},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.repair.refresh_from_db()
        self.assertEqual(self.repair.description, "Исправлено описание")
        self.assertIsNone(self.repair.rental_contract_id)
        self._logger_success("description", "Updated without assigning a contract")

    def test_existing_contract_cannot_be_removed(self) -> None:
        self._logger_header("REPAIR REQUEST: REMOVE A RENTAL CONTRACT")
        serializer = RepairRequestWriteSerializer(
            instance=self.repair,
            data={"rental_contract": None},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("rental_contract", serializer.errors)
        self._logger_success("rental_contract", "Contract removal rejected")

    def test_changing_object_rejects_mismatched_contract(self) -> None:
        self._logger_header("REPAIR REQUEST: CHANGE TO ANOTHER CUSTOMER'S OBJECT")
        new_object = ConstructionObjectFactory.create(customer=CustomerFactory.create())
        serializer = RepairRequestWriteSerializer(
            instance=self.repair,
            data={"construction_object": new_object.pk},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("rental_contract", serializer.errors)
        self._logger_success(
            "rental_contract", "Object change rejected for mismatched contract"
        )

    def test_historical_contract_is_still_selectable(self) -> None:
        self._logger_header("REPAIR REQUEST: SELECT A HISTORICAL CONTRACT")
        RentalContractFactory.create(
            customer=self.customer
        )  # Deactivates the former contract.
        self.contract.refresh_from_db()
        self.assertFalse(self.contract.is_active)
        serializer = RepairRequestWriteSerializer(instance=self.repair, partial=True)
        attrs = {"rental_contract": self.contract}
        self.assertEqual(serializer.validate(attrs), attrs)
        self._logger_success("rental_contract", "Inactive contract accepted")

    def test_read_serializer_exposes_contract_and_flag(self) -> None:
        self._logger_header("REPAIR REQUEST: READ CONTRACT AND AFTER-RETURN FLAG")
        data = RepairRequestReadSerializer(self.repair).data
        self.assertEqual(data["rental_contract"], self.contract.pk)
        self.assertEqual(
            data["rental_contract_number"],
            str(self.contract.contract_number),
        )
        self.assertFalse(data["is_after_return"])
        self.assertIn("request_files", data)
        self._logger_success(
            "serializer", "Contract, after-return flag, and files verified"
        )

    def test_referenced_contract_cannot_be_deleted(self) -> None:
        self._logger_header("REPAIR REQUEST: DELETE A REFERENCED CONTRACT")
        with self.assertRaises(ProtectedError):
            self.contract.delete()
        self._logger_success(
            "rental_contract", "Referenced contract protected from deletion"
        )

    def test_model_clean_checks_location(self) -> None:
        self._logger_header("REPAIR REQUEST: MODEL VALIDATES AFTER-RETURN LOCATION")
        self.repair.is_after_return = True
        with self.assertRaises(DjangoValidationError) as raised:
            self.repair.clean()
        self.assertIn("is_after_return", raised.exception.message_dict)
        self._logger_success(
            "is_after_return", "Model validation rejected the site location"
        )
