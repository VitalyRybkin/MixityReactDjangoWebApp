"""Three repair workflows; legacy linked workshop repairs are preserved."""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from order.tests.factories import ConstructionObjectFactory, CustomerFactory, RentalContractFactory
from repairs.models import RepairCompany
from repairs.models.repair_request_models import (
    RepairRequest,
    RepairService,
    RepairSpecification,
)
from repairs.serializers.repair_request_serializers import (
    RepairRequestExportReadSerializer,
    RepairRequestReadSerializer,
    RepairRequestWriteSerializer,
)


class TestRepairMaintenance(TestCase):
    def setUp(self) -> None:
        self.customer = CustomerFactory.create()
        self.object = ConstructionObjectFactory.create(customer=self.customer)
        self.contract = RentalContractFactory.create(customer=self.customer)
        self.site = RepairRequest.objects.create(
            construction_object=self.object,
            rental_contract=self.contract,
            location="site",
        )

    def test_new_regulatory_repair_without_object_and_contract(self) -> None:
        serializer = RepairRequestWriteSerializer()
        data = {"location": "workshop", "is_after_return": False}
        self.assertEqual(serializer.validate(data), data)

    def test_model_regulatory_repair_clean(self) -> None:
        repair = RepairRequest(location="workshop", is_after_return=False)
        repair.clean()
        self.assertIsNone(repair.construction_object_id)
        self.assertIsNone(repair.rental_contract_id)

    def test_post_regulatory_repair_creates_without_rental_context(self) -> None:
        company = RepairCompany.objects.create(name="ТО: тестовая компания")
        serializer = RepairRequestWriteSerializer(data={
            "location": "workshop",
            "is_after_return": False,
            "repair_company": company.pk,
            "description": "Регламентное ТО",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        repair = serializer.save()
        self.assertIsNone(repair.construction_object_id)
        self.assertIsNone(repair.rental_contract_id)
        self.assertEqual(repair.location, "workshop")

    def test_new_site_still_requires_object_and_contract(self) -> None:
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({"location": "site"})
        self.assertIn("construction_object", raised.exception.detail)
        self.assertIn("rental_contract", raised.exception.detail)

    def test_after_return_still_requires_both_links(self) -> None:
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({"location": "workshop", "is_after_return": True})
        self.assertIn("construction_object", raised.exception.detail)
        self.assertIn("rental_contract", raised.exception.detail)

    def test_new_workshop_without_return_cannot_keep_rental_links(self) -> None:
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({
                "location": "workshop", "is_after_return": False,
                "construction_object": self.object, "rental_contract": self.contract,
            })
        self.assertIn("construction_object", raised.exception.detail)
        self.assertIn("rental_contract", raised.exception.detail)

    def test_switch_site_to_regulatory_clears_both_links(self) -> None:
        serializer = RepairRequestWriteSerializer(
            self.site,
            data={"location": "workshop", "construction_object": None, "rental_contract": None},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.site.refresh_from_db()
        self.assertIsNone(self.site.construction_object_id)
        self.assertIsNone(self.site.rental_contract_id)
        self.assertEqual(self.site.location, "workshop")
        self.assertFalse(self.site.is_after_return)

    def test_switch_site_without_clearing_links_rejected(self) -> None:
        serializer = RepairRequestWriteSerializer(
            self.site, data={"location": "workshop"}, partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("construction_object", serializer.errors)

    def test_legacy_workshop_remains_linked_on_unrelated_patch(self) -> None:
        legacy = RepairRequest.objects.create(
            construction_object=self.object,
            rental_contract=self.contract,
            location="workshop",
            is_after_return=False,
        )
        serializer = RepairRequestWriteSerializer(
            legacy, data={"description": "Сохранено"}, partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        legacy.refresh_from_db()
        self.assertEqual(legacy.construction_object_id, self.object.pk)
        self.assertEqual(legacy.rental_contract_id, self.contract.pk)
        legacy.clean()

    def test_legacy_workshop_cannot_change_object_without_reclassification(self) -> None:
        legacy = RepairRequest.objects.create(
            construction_object=self.object, rental_contract=self.contract, location="workshop",
        )
        other_object = ConstructionObjectFactory.create(customer=self.customer)
        serializer = RepairRequestWriteSerializer(
            legacy, data={"construction_object": other_object.pk}, partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("construction_object", serializer.errors)

    def test_regulatory_repair_disallows_rebillable_specification(self) -> None:
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({
                "location": "workshop", "specifications": [{"is_rebillable": True}],
            })
        self.assertIn("specifications", raised.exception.detail)

    def test_transition_to_regulatory_requires_clearing_old_rebills(self) -> None:
        service = RepairService.objects.create(name="Диагностика")
        RepairSpecification.objects.create(
            repair_request=self.site, service=service, quantity=1, is_rebillable=True,
        )
        serializer = RepairRequestWriteSerializer(
            self.site,
            data={"location": "workshop", "construction_object": None, "rental_contract": None},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("specifications", serializer.errors)

    def test_regulatory_repair_full_clean_rebillable_specification(self) -> None:
        maintenance = RepairRequest.objects.create(location="workshop")
        service = RepairService.objects.create(name="ТО")
        spec = RepairSpecification(
            repair_request=maintenance, service=service, quantity=1, is_rebillable=True,
        )
        with self.assertRaises(DjangoValidationError) as raised:
            spec.full_clean()
        self.assertIn("is_rebillable", raised.exception.message_dict)

    def test_read_and_export_without_object(self) -> None:
        maintenance = RepairRequest.objects.create(location="workshop")
        self.assertIsNone(RepairRequestReadSerializer(maintenance).data["construction_object"])
        exported = RepairRequestExportReadSerializer(maintenance).data
        self.assertIsNone(exported["customer"])
        self.assertIsNone(exported["construction_object"])
        self.assertIsNone(exported["construction_object_address"])

    def test_site_and_return_mismatched_contract_customer(self) -> None:
        other_contract = RentalContractFactory.create(customer=CustomerFactory.create())
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({
                "location": "workshop", "is_after_return": True,
                "construction_object": self.object, "rental_contract": other_contract,
            })
        self.assertIn("rental_contract", raised.exception.detail)
