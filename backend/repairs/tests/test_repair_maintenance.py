"""Three repair workflows; legacy linked workshop repairs are preserved."""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from core.tests.utils import TestLoggerMixin
from order.tests.factories import (
    ConstructionObjectFactory,
    CustomerFactory,
    RentalContractFactory,
)
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


class TestRepairMaintenance(TestLoggerMixin, TestCase):
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
        self._logger_header(
            "REPAIR MAINTENANCE: " "NEW REGULATORY REPAIR WITHOUT OBJECT AND CONTRACT"
        )
        serializer = RepairRequestWriteSerializer()
        data = {"location": "workshop", "is_after_return": False}
        self.assertEqual(serializer.validate(data), data)
        self._logger_success(
            "New regulatory repair without object and contract",
            "Serializer accepted a request without rental links",
        )

    def test_model_regulatory_repair_clean(self) -> None:
        self._logger_header("REPAIR MAINTENANCE: MODEL REGULATORY REPAIR CLEAN")
        repair = RepairRequest(location="workshop", is_after_return=False)
        repair.clean()
        self.assertIsNone(repair.construction_object_id)
        self.assertIsNone(repair.rental_contract_id)
        self._logger_success(
            "Model regulatory repair clean",
            "Model validation accepted a request without rental links",
        )

    def test_post_regulatory_repair_creates_without_rental_context(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: "
            "POST REGULATORY REPAIR CREATES WITHOUT RENTAL CONTEXT"
        )
        company = RepairCompany.objects.create(name="ТО: тестовая компания")
        serializer = RepairRequestWriteSerializer(
            data={
                "location": "workshop",
                "is_after_return": False,
                "repair_company": company.pk,
                "description": "Регламентное ТО",
            }
        )
        self.assertTrue(serializer.is_valid(), str(serializer.errors))
        repair = serializer.save()
        self.assertIsNone(repair.construction_object_id)
        self.assertIsNone(repair.rental_contract_id)
        self.assertEqual(repair.location, "workshop")
        self._logger_success(
            "Post regulatory repair creates without rental context",
            "Request persisted without an object or contract",
        )

    def test_new_site_still_requires_object_and_contract(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: " "NEW SITE STILL REQUIRES OBJECT AND CONTRACT"
        )
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({"location": "site"})
        self.assertIn("construction_object", raised.exception.detail)
        self.assertIn("rental_contract", raised.exception.detail)
        self._logger_success(
            "New site still requires object and contract",
            "Validation reported both required links",
        )

    def test_after_return_still_requires_both_links(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: " "AFTER RETURN STILL REQUIRES BOTH LINKS"
        )
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate({"location": "workshop", "is_after_return": True})
        self.assertIn("construction_object", raised.exception.detail)
        self.assertIn("rental_contract", raised.exception.detail)
        self._logger_success(
            "After return still requires both links",
            "Validation reported both required links",
        )

    def test_new_workshop_without_return_cannot_keep_rental_links(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: "
            "NEW WORKSHOP WITHOUT RETURN CANNOT KEEP RENTAL LINKS"
        )
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate(
                {
                    "location": "workshop",
                    "is_after_return": False,
                    "construction_object": self.object,
                    "rental_contract": self.contract,
                }
            )
        self.assertIn("construction_object", raised.exception.detail)
        self.assertIn("rental_contract", raised.exception.detail)
        self._logger_success(
            "New workshop without return cannot keep rental links",
            "Validation rejected both rental links",
        )

    def test_switch_site_to_regulatory_clears_both_links(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: " "SWITCH SITE TO REGULATORY CLEARS BOTH LINKS"
        )
        serializer = RepairRequestWriteSerializer(
            self.site,
            data={
                "location": "workshop",
                "construction_object": None,
                "rental_contract": None,
            },
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), str(serializer.errors))
        serializer.save()
        self.site.refresh_from_db()
        self.assertIsNone(self.site.construction_object_id)
        self.assertIsNone(self.site.rental_contract_id)
        self.assertEqual(self.site.location, "workshop")
        self.assertFalse(self.site.is_after_return)
        self._logger_success(
            "Switch site to regulatory clears both links",
            "Both links cleared on the saved request",
        )

    def test_switch_site_without_clearing_links_rejected(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: " "SWITCH SITE WITHOUT CLEARING LINKS REJECTED"
        )
        serializer = RepairRequestWriteSerializer(
            self.site,
            data={"location": "workshop"},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("construction_object", serializer.errors)
        self._logger_success(
            "Switch site without clearing links rejected",
            "Validation rejected the retained links",
        )

    def test_legacy_workshop_remains_linked_on_unrelated_patch(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: " "LEGACY WORKSHOP REMAINS LINKED ON UNRELATED PATCH"
        )
        legacy = RepairRequest.objects.create(
            construction_object=self.object,
            rental_contract=self.contract,
            location="workshop",
            is_after_return=False,
        )
        serializer = RepairRequestWriteSerializer(
            legacy,
            data={"description": "Сохранено"},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), str(serializer.errors))
        serializer.save()
        legacy.refresh_from_db()
        self.assertEqual(legacy.construction_object_id, self.object.pk)
        self.assertEqual(legacy.rental_contract_id, self.contract.pk)
        legacy.clean()
        self._logger_success(
            "Legacy workshop remains linked on unrelated patch",
            "Existing object and contract IDs preserved",
        )

    def test_legacy_workshop_cannot_change_object_without_reclassification(
        self,
    ) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: "
            "LEGACY WORKSHOP CANNOT CHANGE OBJECT WITHOUT RECLASSIFICATION"
        )
        legacy = RepairRequest.objects.create(
            construction_object=self.object,
            rental_contract=self.contract,
            location="workshop",
        )
        other_object = ConstructionObjectFactory.create(customer=self.customer)
        serializer = RepairRequestWriteSerializer(
            legacy,
            data={"construction_object": other_object.pk},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("construction_object", serializer.errors)
        self._logger_success(
            "Legacy workshop cannot change object without reclassification",
            "Validation rejected the object change",
        )

    def test_regulatory_repair_disallows_rebillable_specification(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: "
            "REGULATORY REPAIR DISALLOWS REBILLABLE SPECIFICATION"
        )
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate(
                {
                    "location": "workshop",
                    "specifications": [{"is_rebillable": True}],
                }
            )
        self.assertIn("specifications", raised.exception.detail)
        self._logger_success(
            "Regulatory repair disallows rebillable specification",
            "Validation reported the rebillable specification",
        )

    def test_transition_to_regulatory_requires_clearing_old_rebills(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: "
            "TRANSITION TO REGULATORY REQUIRES CLEARING OLD REBILLS"
        )
        service = RepairService.objects.create(name="Диагностика")
        RepairSpecification.objects.create(
            repair_request=self.site,
            service=service,
            quantity=1,
            is_rebillable=True,
        )
        serializer = RepairRequestWriteSerializer(
            self.site,
            data={
                "location": "workshop",
                "construction_object": None,
                "rental_contract": None,
            },
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("specifications", serializer.errors)
        self._logger_success(
            "Transition to regulatory requires clearing old rebills",
            "Validation rejected the existing rebillable specification",
        )

    def test_regulatory_repair_full_clean_rebillable_specification(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: "
            "REGULATORY REPAIR FULL CLEAN REBILLABLE SPECIFICATION"
        )
        maintenance = RepairRequest.objects.create(location="workshop")
        service = RepairService.objects.create(name="ТО")
        spec = RepairSpecification(
            repair_request=maintenance,
            service=service,
            quantity=1,
            is_rebillable=True,
        )
        with self.assertRaises(DjangoValidationError) as raised:
            spec.full_clean()
        self.assertIn("is_rebillable", raised.exception.message_dict)
        self._logger_success(
            "Regulatory repair full clean rebillable specification",
            "Model validation rejected a rebillable specification",
        )

    def test_read_and_export_without_object(self) -> None:
        self._logger_header("REPAIR MAINTENANCE: READ AND EXPORT WITHOUT OBJECT")
        maintenance = RepairRequest.objects.create(location="workshop")
        self.assertIsNone(
            RepairRequestReadSerializer(maintenance).data["construction_object"]
        )
        exported = RepairRequestExportReadSerializer(maintenance).data
        self.assertIsNone(exported["customer"])
        self.assertIsNone(exported["construction_object"])
        self.assertIsNone(exported["construction_object_address"])
        self._logger_success(
            "Read and export without object",
            "Read and export serializers handled a missing object",
        )

    def test_site_and_return_mismatched_contract_customer(self) -> None:
        self._logger_header(
            "REPAIR MAINTENANCE: " "SITE AND RETURN MISMATCHED CONTRACT CUSTOMER"
        )
        other_contract = RentalContractFactory.create(customer=CustomerFactory.create())
        serializer = RepairRequestWriteSerializer()
        with self.assertRaises(ValidationError) as raised:
            serializer.validate(
                {
                    "location": "workshop",
                    "is_after_return": True,
                    "construction_object": self.object,
                    "rental_contract": other_contract,
                }
            )
        self.assertIn("rental_contract", raised.exception.detail)
        self._logger_success(
            "Site and return mismatched contract customer",
            "Validation rejected the other customer's contract",
        )
