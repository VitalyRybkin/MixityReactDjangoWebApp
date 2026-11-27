"""The shared RepairService directory is scoped by usage, not duplicated."""

from datetime import date

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from additional_services.models import AdditionalServiceItem
from additional_services.repair_service_catalog import (
    AdditionalRepairServiceSerializer,
)
from additional_services.routes import AdditionalServicesRoutes
from additional_services.serializers import AdditionalServiceItemWriteSerializer
from order.models import RentalContract
from order.tests.factories import ConstructionObjectFactory
from repairs.models import RepairCompany
from repairs.models.repair_request_models import RepairService
from repairs.views.repair_request_views import RepairServicesListAPIView


class TestAdditionalRepairServiceCatalog(APITestCase):
    def setUp(self) -> None:
        user_model = get_user_model()
        self.user = user_model.objects.create_superuser(
            **{user_model.USERNAME_FIELD: "additional_catalog_admin"},
            password="test",
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse(
            f"additional_services:{AdditionalServicesRoutes.SERVICES.name}"
        )

    def test_lists_only_active_additional_services(self) -> None:
        RepairService.objects.create(name="Ремонт", is_additional=False)
        extra = RepairService.objects.create(
            name="Выезд специалиста", is_additional=True
        )
        RepairService.objects.create(
            name="Неактивная услуга", is_additional=True, is_active=False
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual([row["id"] for row in response.data], [extra.pk])

    def test_creates_additional_service_in_existing_repair_service_table(self) -> None:
        response = self.client.post(self.url, {"name": "Пусконаладка"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        service = RepairService.objects.get(pk=response.data["id"])
        self.assertTrue(service.is_additional)
        self.assertEqual(service.name, "Пусконаладка")
        self.assertFalse(
            RepairServicesListAPIView.queryset.filter(pk=service.pk).exists()
        )

    def test_duplicate_name_in_additional_directory_rejected(self) -> None:
        RepairService.objects.create(name="Пусконаладка", is_additional=True)
        response = self.client.post(self.url, {"name": "пусконаладка"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_trims_name_and_checks_only_the_additional_directory(self) -> None:
        RepairService.objects.create(name="МОНТАЖ", is_additional=False)
        response = self.client.post(self.url, {"name": "\tМонтаж  "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        service = RepairService.objects.get(pk=response.data["id"])
        self.assertEqual(service.name, "Монтаж")

        RepairService.objects.create(
            name="  Подъём  ", is_additional=True, is_active=False
        )
        response = self.client.post(self.url, {"name": " ПОДЪЁМ\t"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_trims_name_and_excludes_current_service(self) -> None:
        service = RepairService.objects.create(name="Монтаж", is_additional=True)
        serializer = AdditionalRepairServiceSerializer(
            service, data={"name": "  МОНТАЖ\t"}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        service.refresh_from_db()
        self.assertEqual(service.name, "МОНТАЖ")

        RepairService.objects.create(name="Демонтаж", is_additional=True)
        serializer = AdditionalRepairServiceSerializer(
            service, data={"name": "  ДЕМОНТАЖ "}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_service_link_rejects_repair_only_name(self) -> None:
        repair = RepairService.objects.create(name="Замена узла", is_additional=False)
        payload = {
            "category": "specialist",
            "service": repair.pk,
            "name": "Замена узла",
            "quantity": "1.000",
            "cost_per_unit": "100.00",
            "price_per_unit": "120.00",
            "is_rebillable": False,
        }
        serializer = AdditionalServiceItemWriteSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("service", serializer.errors)

        additional = RepairService.objects.create(name="Монтаж", is_additional=True)
        payload["service"] = additional.pk
        payload["name"] = "Неправильное название от клиента"
        serializer = AdditionalServiceItemWriteSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["name"], "Монтаж")
        self.assertEqual(serializer.validated_data["service"], additional)

    def test_transport_does_not_accept_specialist_service_link(self) -> None:
        additional = RepairService.objects.create(name="Монтаж", is_additional=True)
        serializer = AdditionalServiceItemWriteSerializer(
            data={
                "category": "transport",
                "service": additional.pk,
                "name": "Кран",
                "quantity": "1.000",
                "cost_per_unit": "100.00",
                "price_per_unit": "120.00",
                "is_rebillable": False,
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("service", serializer.errors)

    def test_old_free_text_items_are_still_accepted(self) -> None:
        serializer = AdditionalServiceItemWriteSerializer(
            data={
                "category": "specialist",
                "name": "Историческая услуга",
                "quantity": "1.000",
                "cost_per_unit": "100.00",
                "price_per_unit": "120.00",
                "is_rebillable": False,
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data.get("service"))

    def test_request_saves_fk_and_historical_name_snapshot(self) -> None:
        service = RepairService.objects.create(
            name="Выезд специалиста", is_additional=True
        )
        obj = ConstructionObjectFactory.create()
        contract = RentalContract.objects.create(
            customer=obj.customer,
            contract_date=date(2026, 11, 27),
            contract_number="AS-SHARED-CATALOG-TEST",
            is_active=True,
        )
        company = RepairCompany.objects.create(name="Исполнитель для проверки")
        response = self.client.post(
            reverse(f"additional_services:{AdditionalServicesRoutes.LIST_CREATE.name}"),
            {
                "service_date": "2026-11-27",
                "status": "open",
                "direction": "site_work",
                "construction_object": obj.pk,
                "rental_contract": contract.pk,
                "carrier": None,
                "repair_company": company.pk,
                "description": "",
                "items": [
                    {
                        "category": "specialist",
                        "name": "Подменённый текст",
                        "service": service.pk,
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
        self.assertEqual(item.service_id, service.pk)
        self.assertEqual(item.name, "Выезд специалиста")
        service.name = "Новое название в справочнике"
        service.save()
        item.refresh_from_db()
        self.assertEqual(item.name, "Выезд специалиста")

    def test_permission_isolated_from_repairs_directory(self) -> None:
        normal = get_user_model().objects.create_user(
            **{get_user_model().USERNAME_FIELD: "additional_catalog_only"},
            password="test",
        )
        normal.user_permissions.add(
            Permission.objects.get(
                content_type__app_label="additional_services",
                codename="view_additionalservicerequest",
            ),
            Permission.objects.get(
                content_type__app_label="additional_services",
                codename="add_additionalservicerequest",
            ),
        )
        self.client.force_authenticate(user=normal)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(
                self.url, {"name": "Консультация"}, format="json"
            ).status_code,
            status.HTTP_201_CREATED,
        )
