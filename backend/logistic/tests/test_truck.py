from decimal import Decimal
from typing import Any, Dict, Optional

from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from logistic.models import TruckCapacity, TruckType
from logistic.tests.factories import TruckCapacityFactory, TruckTypeFactory


class BaseTruckAPITestCase(APITestCase):
    """
    Provides a base test case for API testing specific to truck-related models.

    Provides common functionalities for testing API
    endpoints. It is expected to be subclassed, and specific parameters like
    factory, url_name, and fields_map should be provided in the subclass for
    proper functioning.

    :ivar model: Model class associated with the API being tested.
    :type model: type
    :ivar factory: Factory instance used to create model instances.
    :type factory: Factory
    :ivar url_name: Name of the API endpoint's URL pattern.
    :type url_name: str
    :ivar fields_map: A mapping between API response fields and model fields.
        The mapping is a dictionary where the key is the API field name,
        and the value is a tuple containing the model field name and an
        optional data type for conversion during validation.
    :type fields_map: dict
    """

    model: Any = None
    factory: Any = None
    url_name: Optional[str] = None
    fields_map: Dict[str, Any] = {}

    def setUp(self) -> None:
        if not self.factory or not self.url_name:
            return

        self.url = reverse(self.url_name)
        self.obj = self.factory.create()

    def test_list_logic(self) -> None:
        """
        Validates the logic of retrieving and comparing list data from the API.

        Sends a GET request to the API endpoint and checks if the
        response status is 200 (successful). Additionally, it verifies that the
        retrieved data matches the expected values using field mappings
        defined in `fields_map`.

        :raises AssertionError: If the response status code is not 200 or if
            the data does not match the expected values based on `fields_map`.
        """
        if not self.factory:
            return
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        for api_f, (mod_f, t) in self.fields_map.items():
            val = response.data[0][api_f]
            if t == Decimal:
                val = Decimal(val)
            self.assertEqual(val, getattr(self.obj, mod_f))


class TruckTypeAPITestCase(BaseTruckAPITestCase):
    """
    Represents the test case for API operations related to the TruckType model.

    Extends BaseTruckAPITestCase to provide specific tests for the
    TruckType API. It uses the associated model, factory, and URLs to organize
    and verify API functionality. This ensures the reliability of CRUD operations
    and specific behaviors such as string representation.

    :ivar model: Reference to the TruckType model being tested.
    :type model: TruckType
    :ivar factory:  Factory is associated with creating TruckType instances for testing.
    :type factory: TruckTypeFactory
    :ivar url_name: API endpoint name for listing and creating truck types.
    :type url_name: str
    :ivar fields_map: Mapping of API field names to model attributes and their respective types.
    :type fields_map: dict[str, tuple[str, type]]
    """

    model = TruckType
    factory = TruckTypeFactory
    url_name = "truck_types_list_create"
    fields_map = {
        "id": ("id", int),
        "truckType": ("type", str),
        "description": ("description", str),
    }

    def test_get_list(self) -> None:
        self.test_list_logic()

    def test_str_method(self) -> None:
        self.assertEqual(str(self.obj), f"Тип ТС - {self.obj.type}")


class TruckCapacityAPITestCase(BaseTruckAPITestCase):
    """
    Test case for TruckCapacity API.

    Validates the functionality and behavior of the
    TruckCapacity API. It includes functionality for retrieving the list of
    TruckCapacity objects and verifying the string representation of the model.

    :ivar model: The model class being tested.
    :type model: type[TruckCapacity]
    :ivar factory: The factory class used for generating test instances of the model.
    :type factory: type[TruckCapacityFactory]
    :ivar url_name: The URL name associated with the list and create API endpoint.
    :type url_name: str
    :ivar fields_map: Mapping of fields in the model to their corresponding display
                      names and types.
    :type fields_map: dict[str, tuple[str, type]]
    """

    model = TruckCapacity
    factory = TruckCapacityFactory
    url_name = "truck_capacities_list_create"
    fields_map = {
        "id": ("id", int),
        "capacity": ("capacity", Decimal),
        "description": ("description", str),
    }

    def test_get_list(self) -> None:
        self.test_list_logic()

    def test_str_method(self) -> None:
        self.assertEqual(str(self.obj), f"Грузоподъемность - {self.obj.capacity} т")
