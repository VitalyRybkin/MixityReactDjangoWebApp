"""Catalog and saved-snapshot behavior for transport items in Additional Services."""

from datetime import date

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db.models.deletion import ProtectedError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from additional_services.models import AdditionalServiceItem, TransportService
from additional_services.routes import AdditionalServicesRoutes
from additional_services.serializers import (
    AdditionalServiceItemWriteSerializer,
    AdditionalServiceWriteSerializer,
)
from additional_services.transport_service_catalog import (
    TransportServiceCatalogSerializer,
)
from core.tests.utils import TestLoggerMixin
from order.models import RentalContract
from order.tests.factories import ConstructionObjectFactory
from repairs.models import RepairCompany


class TestTransportServiceCatalog(TestLoggerMixin, APITestCase):
    def setUp(self) -> None:
        user_model = get_user_model()
        self.user = user_model.objects.create_superuser(
            **{user_model.USERNAME_FIELD: "transport_catalog_admin"},
            password="test",
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse(
            f"additional_services:{AdditionalServicesRoutes.TRANSPORT_SERVICES.name}"
        )

    def test_lists_only_active_transport_entries(self) -> None:
        self._logger_header("TRANSPORT CATALOG: LIST ACTIVE ENTRIES")
        active = TransportService.objects.create(name="Аренда крана")
        TransportService.objects.create(name="Старая перевозка", is_active=False)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual([row["id"] for row in response.data], [active.pk])
        self._logger_success("HTTP 200", "Only the active entry was returned")

    def test_create_trims_name_and_rejects_case_insensitive_duplicates(self) -> None:
        self._logger_header("TRANSPORT CATALOG: VALIDATE NEW ENTRY NAMES")
        response = self.client.post(
            self.url, {"name": "  Манипулятор  "}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["name"], "Манипулятор")
        self.assertTrue(response.data["is_active"])
        self.assertEqual(
            self.client.post(
                self.url, {"name": "манипулятор"}, format="json"
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(self.url, {"name": "   "}, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self._logger_success(
            "HTTP 201 / 400", "Name trimmed and invalid names rejected"
        )

    def test_create_rejects_cyrillic_duplicate_of_legacy_padded_name(self) -> None:
        TransportService.objects.create(name="  Подъём  ", is_active=False)
        response = self.client.post(self.url, {"name": "\tПОДЪЁМ  "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_trims_name_and_excludes_current_service(self) -> None:
        service = TransportService.objects.create(name="Доставка")
        serializer = TransportServiceCatalogSerializer(
            service, data={"name": "\tДОСТАВКА  "}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        service.refresh_from_db()
        self.assertEqual(service.name, "ДОСТАВКА")

        TransportService.objects.create(name="Перевозка")
        serializer = TransportServiceCatalogSerializer(
            service, data={"name": " ПЕРЕВОЗКА "}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_permissions_use_additional_services_not_repairs(self) -> None:
        self._logger_header("TRANSPORT CATALOG: ADDITIONAL SERVICES PERMISSIONS")
        user_model = get_user_model()
        limited = user_model.objects.create_user(
            **{user_model.USERNAME_FIELD: "transport_catalog_readonly"},
            password="test",
        )
        limited.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="additional_services",
                codename="view_additionalservicerequest",
            )
        )
        self.client.force_authenticate(user=limited)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(
                self.url, {"name": "Перевозка"}, format="json"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        limited.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="additional_services",
                codename="add_additionalservicerequest",
            )
        )
        self.client.force_authenticate(user=user_model.objects.get(pk=limited.pk))
        self.assertEqual(
            self.client.post(
                self.url, {"name": "Перевозка"}, format="json"
            ).status_code,
            status.HTTP_201_CREATED,
        )
        self._logger_success(
            "Permissions", "Listing and creation require the expected permissions"
        )

    def test_item_serializer_derives_name_and_enforces_matching_category(self) -> None:
        self._logger_header("TRANSPORT CATALOG: ITEM SERIALIZER VALIDATION")
        transport = TransportService.objects.create(name="Доставка")
        payload = {
            "category": "transport",
            "transport_service": transport.pk,
            "name": "Подмена",
            "quantity": "1.000",
            "cost_per_unit": "100.00",
            "price_per_unit": "120.00",
            "is_rebillable": True,
        }
        serializer = AdditionalServiceItemWriteSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["name"], "Доставка")
        self.assertEqual(serializer.validated_data["transport_service"], transport)

        payload["category"] = "specialist"
        serializer = AdditionalServiceItemWriteSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("transport_service", serializer.errors)

        payload.pop("transport_service")
        payload["category"] = "transport"
        serializer = AdditionalServiceItemWriteSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self._logger_success(
            "Item validation",
            "Catalog name, matching category, and legacy input verified",
        )

    def test_new_request_keeps_historical_transport_name_on_catalog_rename(
        self,
    ) -> None:
        self._logger_header("TRANSPORT CATALOG: PRESERVE HISTORICAL ITEM NAME")
        transport = TransportService.objects.create(name="Манипулятор")
        obj = ConstructionObjectFactory.create()
        contract = RentalContract.objects.create(
            customer=obj.customer,
            contract_date=date(2026, 11, 27),
            contract_number="AS-TRANSPORT-CATALOG-TEST",
            is_active=True,
        )
        company = RepairCompany.objects.create(name="Транспортный исполнитель")
        create_url = reverse(
            f"additional_services:{AdditionalServicesRoutes.LIST_CREATE.name}"
        )
        response = self.client.post(
            create_url,
            {
                "service_date": "2026-11-27",
                "status": "open",
                "direction": "delivery",
                "construction_object": obj.pk,
                "rental_contract": contract.pk,
                "carrier": None,
                "repair_company": company.pk,
                "description": "",
                "items": [
                    {
                        "category": "transport",
                        "name": "Подменённый текст",
                        "transport_service": transport.pk,
                        "quantity": "1.000",
                        "cost_per_unit": "100.00",
                        "price_per_unit": "150.00",
                        "is_rebillable": True,
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        item = AdditionalServiceItem.objects.get(request_id=response.data["id"])
        self.assertEqual(item.name, "Манипулятор")
        self.assertEqual(item.transport_service_id, transport.pk)

        transport.name = "Новая редакция названия"
        transport.save()
        instance = item.request
        serializer = AdditionalServiceWriteSerializer(
            instance,
            data={
                "description": "Изменено",
                "items": [
                    {
                        "category": "transport",
                        "name": "Манипулятор",
                        "transport_service": transport.pk,
                        "quantity": "1.000",
                        "cost_per_unit": "100.00",
                        "price_per_unit": "150.00",
                        "is_rebillable": True,
                    }
                ],
            },
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.assertEqual(instance.items.get().name, "Манипулятор")
        with self.assertRaises(ProtectedError):
            transport.delete()
        self._logger_success(
            "Saved item", "Historical name preserved and catalog deletion blocked"
        )
