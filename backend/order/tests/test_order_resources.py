from typing import ClassVar

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.tests.api.factories import ProductFactory
from core.tests.authentication_tests import AuthenticationContractMixin
from core.tests.order_form_access_tests import OrderFormAccessContractMixin
from core.tests.utils import TestLoggerMixin
from order.routes import OrderRoutes
from order.tests.factories import ClientFactory, CustomerFactory, PackTypeFactory
from stock.tests.factories import WarehouseFactory


class TestOrderResourcesAPIView(
    APITestCase,
    AuthenticationContractMixin,
    OrderFormAccessContractMixin,
    TestLoggerMixin,
):
    """
    Test suite for validating the behavior of the order resources API endpoint.

    Args:
        url_name: The name of the API endpoint route for fetching order resources.
        AMOUNT_OF_RESOURCES: The number of resources created for test setup and
            validation purposes.
    """

    url_name = f"order_orders:{OrderRoutes.RESOURCES.name}"
    AMOUNT_OF_RESOURCES: ClassVar[int] = 3

    def setUp(self) -> None:
        super().setUp()

        self.url = reverse(self.url_name)

        user_model = get_user_model()

        self.user = user_model.objects.create_superuser(
            username="test_order_resources_admin",
            email="test_order_resources_admin@example.com",
            password="test_password",
        )

        self.client.force_authenticate(user=self.user)

    def test_order_resources(self) -> None:
        """Test the order resources API endpoint."""
        ClientFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        CustomerFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        ProductFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        WarehouseFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        PackTypeFactory.create_batch(self.AMOUNT_OF_RESOURCES)

        url = reverse(self.url_name)

        self._logger_header(f"ENDPOINT GET: {url}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_resources = {
            "clients": self.AMOUNT_OF_RESOURCES,
            "customers": self.AMOUNT_OF_RESOURCES,
            "products": self.AMOUNT_OF_RESOURCES,
            "warehouses": self.AMOUNT_OF_RESOURCES,
            "pack_types": self.AMOUNT_OF_RESOURCES,
        }

        for resource_name, expected_count in expected_resources.items():
            with self.subTest(resource=resource_name):
                self.assertIn(resource_name, response.data)
                self.assertEqual(len(response.data[resource_name]), expected_count)

                for item in response.data[resource_name]:
                    self.assertIn("id", item)

                print(
                    f"{self.INDENT}{self.COLOR['OK']}✓ "
                    f"{resource_name} and id's are available in response | Expected amount received."
                    f"{self.COLOR['END']}"
                )

    def test_order_resources_returns_only_active_items(self) -> None:
        """Test the order resources API endpoint returns only active items."""
        ClientFactory.create_batch(self.AMOUNT_OF_RESOURCES, is_active=True)
        ClientFactory.create_batch(2, is_active=False)

        url = reverse(self.url_name)
        self._logger_header(f"ENDPOINT GET (CHECK ACTIVE ONLY): {url}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["clients"]), self.AMOUNT_OF_RESOURCES)

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ "
            f"Only active clients are returned in response."
            f"{self.COLOR['END']}"
        )

    def test_with_add_order_permission_returns_200(self) -> None:
        self._with_add_order_permission_logic()

    def test_with_change_order_permission_returns_200(self) -> None:
        self._with_change_order_permission_logic()

    def test_with_only_view_order_permission_returns_403(self) -> None:
        self._with_only_view_order_permission_logic()
