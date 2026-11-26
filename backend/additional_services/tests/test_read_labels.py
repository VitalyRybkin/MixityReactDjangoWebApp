"""The list and detail endpoints expose human-readable relation labels."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from additional_services.models import AdditionalServiceRequest
from additional_services.routes import AdditionalServicesRoutes
from logistic.models import Carrier
from order.tests.factories import ConstructionObjectFactory


class TestAdditionalServiceReadLabels(APITestCase):
    def setUp(self) -> None:
        user = get_user_model().objects.create_user(
            username="additional_services_read_labels", password="test_password"
        )
        user.is_superuser = True
        user.save(update_fields=["is_superuser"])
        self.client.force_authenticate(user=user)

        self.obj = ConstructionObjectFactory.create()
        self.carrier = Carrier.objects.create(name="Перевозчик для списка")
        self.record = AdditionalServiceRequest.objects.create(
            direction=AdditionalServiceRequest.Direction.SITE_WORK,
            construction_object=self.obj,
            carrier=self.carrier,
        )

    def test_detail_includes_related_names(self) -> None:
        url = reverse(
            f"additional_services:{AdditionalServicesRoutes.DETAIL.name}",
            kwargs={"pk": self.record.pk},
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["provider_name"], self.carrier.name)
        self.assertEqual(response.data["object_name"], self.obj.name)
        self.assertEqual(response.data["customer_name"], self.obj.customer.name)

    def test_list_includes_related_names(self) -> None:
        url = reverse(
            f"additional_services:{AdditionalServicesRoutes.LIST_CREATE.name}"
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        row = next(
            item for item in response.data["results"] if item["id"] == self.record.pk
        )
        self.assertEqual(row["provider_name"], self.carrier.name)
        self.assertEqual(row["object_name"], self.obj.name)
