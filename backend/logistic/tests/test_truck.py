import json

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from ..models import TruckType
from .factories import TruckTypeFactory


class TruckTypeAPITestCase(APITestCase):
    """
    Test case class for validating API endpoints related to TruckType.

    Provides unit tests to verify the functionality of API endpoints
    associated with TruckType. It includes tests for retrieving the list of
    truck types and ensuring the correct structure and data integrity of the
    API response. Additionally, it verifies the string representation of the
    TruckType model.

    Attributes:
        truck_type (TruckType): A factory-generated instance of a TruckType
            object for testing.
        url (str): The URL for the truck types list-create API endpoint.
    """

    truck_type: TruckType
    url: str

    @classmethod
    def setUpTestData(cls) -> None:
        cls.truck_type = TruckTypeFactory.create()
        cls.url = reverse("truck_types_list_create")

    def test_get_truck_types_list(self) -> None:
        """Tests the GET request for retrieving the list of truck types."""
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/json")

        first_item = response.data[0]
        expected_keys = {"id", "truckType", "description"}
        self.assertEqual(set(first_item.keys()), expected_keys)
        self.assertIsInstance(first_item["id"], int)
        self.assertIsInstance(first_item["truckType"], str)
        self.assertIsInstance(first_item["description"], str)

        expected_fields = ["id", "truckType", "description"]
        self.assertCountEqual(first_item.keys(), expected_fields)

        self.assertIsInstance(response.content, bytes)
        data = json.loads(response.content.decode("utf-8"))
        self.assertEqual(data[0]["truckType"], self.truck_type.type)
        self.assertEqual(data[0]["description"], self.truck_type.description)

        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["truckType"], self.truck_type.type)
        self.assertEqual(response.data[0]["description"], self.truck_type.description)

    def test_create_truck_type(self) -> None:
        """Tests the POST request for creating a new truck type."""
        fake_data = TruckTypeFactory.build()

        payload = {"truckType": fake_data.type, "description": fake_data.description}

        response = self.client.post(self.url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TruckType.objects.filter(type=fake_data.type).exists())
        self.assertEqual(response.data["truckType"], payload["truckType"])

    def test_truck_type_str_method(self) -> None:
        """Tests the string representation of the TruckType model."""
        self.assertEqual(str(self.truck_type), f"Тип ТС - {self.truck_type.type}")
