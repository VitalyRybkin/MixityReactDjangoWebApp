import logging
from decimal import Decimal

from logistic.models import TruckCapacity, TruckType
from logistic.tests.factories import TruckCapacityFactory, TruckTypeFactory

from .base_test_case import BaseAPIMixin

logger = logging.getLogger(__name__)


class TestTruckTypeAPIList(BaseAPIMixin):
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

    __test__ = True

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


class TestTruckCapacityAPIList(BaseAPIMixin):
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

    __test__ = True

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
