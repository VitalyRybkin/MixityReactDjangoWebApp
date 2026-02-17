import logging
import uuid
from decimal import Decimal
from typing import Any, Dict

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.models import Carrier, Truck, TruckCapacity, TruckType
from logistic.tests.factories import (
    CarrierFactory,
    TruckCapacityFactory,
    TruckFactory,
    TruckTypeFactory,
)

logger = logging.getLogger(__name__)


class TruckTypeBaseTest:
    """
    Defines the base structure for testing the TruckType model, associating
    it with a factory and a mapped specification of its fields. It allows specific
    validation of field attributes like type, uniqueness, and requirement.

    Attributes:
        model: The model class associated with this test case.
        factory: The factory class is used to generate test data for the model.
        fields_map: A dictionary defining the specification for each field in the
            model. Each entry associates the field name with its defined traits,
            such as type, whether it is required or if it must be unique.
    """

    model = TruckType
    factory = TruckTypeFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "truckType": FieldSpec("name", str, required=True, unique=True),
        "description": FieldSpec("description", str),
    }


class TestTruckTypeAPIList(TruckTypeBaseTest, BaseAPIMixin):
    """
    Provides test cases to verify the behavior of the list, create, and validation
    operations on Truck Types via the Truck Types API. It ensures correctness of fetching,
    creation, uniqueness constraints, mandatory fields validation, and string representation
    of truck types.

    Attributes:
        url_name: URL name for the truck types API endpoint.
    """

    __test__ = True

    url_name = "logistic:truck_types_list_create"

    def test_get_list(self) -> None:
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        payload = self.payload_generator()
        payload["truckType"] += f"-{uuid.uuid4().hex[:4]}"

        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        str_method_output = f"Тип ТС - {self.obj.name}"
        self._str_method_logic(str_method_output)

    def payload_generator(self) -> Dict[str, Any]:
        temp_data = self.factory.build()

        payload = {
            "truckType": temp_data.name,
            "description": temp_data.description,
        }
        return payload


class TestTruckTypeRetrieveUpdate(TruckTypeBaseTest, BaseAPIMixin):
    """
    Retrieves and updates functionalities for truck type details. Extends base
    testing classes for reuse of common logic and API test functionalities.
    These tests ensure proper behavior for retrieving and updating truck type details,
    as well as handling cases where the requested truck type does not exist.

    Attributes:
        detail_url_name: The name of the URL used for accessing detailed truck
        type information.
    """

    __test__ = True

    detail_url_name = "logistic:truck_types_details"

    def test_retrieve_update_logic(self) -> None:
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        self._retrieve_object_by_id_not_found()


class TruckCapacityBaseTest:
    """
    Provides a standardized testing configuration for the
    TruckCapacity model, including its associated factory for creating instances and
    a mapping of its fields to their respective specifications. It ensures that the
    fields are properly tested with respect to their types and requirements.

    Attributes:
        model: The model class under test, which is `TruckCapacity`.
        factory: The corresponding factory class for creating test instances of `TruckCapacity`.
        fields_map: A dictionary mapping internal model field names to `FieldSpec`
            objects that define field properties such as type, required status,
            and uniqueness constraints.
    """

    model = TruckCapacity
    factory = TruckCapacityFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "capacity": FieldSpec("capacity", Decimal, required=True),
        "description": FieldSpec("description", str),
    }


class TestTruckCapacityAPIList(TruckCapacityBaseTest, BaseAPIMixin):
    """
    Extends `TruckCapacityBaseTest` and `BaseAPIMixin`. Provides test cases
    to validate the functionality of listing, creating, and handling unique and mandatory
    fields for truck capacities. It also includes utility functionalities for generating
    payloads and testing specific logic, such as the string representation of objects.

    Attributes:
        url_name (str): The name of the API endpoint for listing and creating truck capacities.
    """

    __test__ = True

    url_name = "logistic:truck_capacities_list_create"

    def test_get_list(self) -> None:
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        str_method_output = f"Грузоподъемность - {self.obj.capacity} т"
        self._str_method_logic(str_method_output)

    def payload_generator(self) -> Dict[str, Any]:
        temp_data = self.factory.build()

        payload = {
            "capacity": temp_data.capacity,
            "description": temp_data.description,
        }
        return payload


class TestTruckCapacityRetrieveUpdate(TruckCapacityBaseTest, BaseAPIMixin):
    """
    Provides test cases to verify the functioning of the APIs
    that allow retrieval and update of truck capacity information. Validates functionality such as
    retrieving specific truck capacity data, checking API behavior on missing data,
    and updating existing truck capacities.

    Attributes:
        detail_url_name: A string representing the name of the API endpoint
            detail URL for accessing specific truck capacity records.
    """

    __test__ = True

    detail_url_name = "logistic:truck_capacities_details"

    def test_retrieve_update_logic(self) -> None:
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        self._retrieve_object_by_id_not_found()


class TruckBaseTest:
    """
    Provides key configurations and mappings needed for creating and
    testing Truck objects and their attributes. Designed to be a base
    class for extending Truck-specific tests, facilitating standardized
    tests by providing fields and metadata.

    Attributes:
        model (type): The model class associated with the test,
            representing a Truck.
        factory (type): The factory class used for creating Truck
            instances during testing.
        fields_map (dict): A dictionary mapping field names of the model
            to their specifications, including type, required status,
            and additional constraints.
    """

    model = Truck
    factory = TruckFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "truckType": FieldSpec("truck_type", TruckType, required=True),
        "capacity": FieldSpec("capacity", TruckCapacity, required=True),
        "carrier": FieldSpec("carrier", Carrier, required=True),
        "licensePlate": FieldSpec("license_plate", str, unique=True, required=True),
        "description": FieldSpec("description", str),
    }


class TestTruckAPIList(TruckBaseTest, BaseAPIMixin):
    """
    Tests the list and creation operations of the Truck API.
    Encapsulates logic for verifying key functionalities like retrieving a list
    of trucks, creating a new truck item, and testing unique and mandatory fields of
    a truck item. Additionally, it validates the proper functioning of the string
    representation method for trucks.

    Attributes:
        url_name (str): The endpoint name for trucks list and create operations.
    """

    url_name = "logistic:trucks_list_create"

    __test__ = True

    def test_get_list(self) -> None:
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        truck = self.obj
        expected = f"Авто: {truck.truck_type}, {truck.capacity}, {truck.carrier}"
        self._str_method_logic(expected)

    def payload_generator(self) -> Dict[str, Any]:
        carrier = CarrierFactory.create()
        truck_type = TruckTypeFactory.create()
        capacity = TruckCapacityFactory.create()

        temp = self.factory.build()

        return {
            "licensePlate": temp.license_plate,
            "description": temp.description,
            "truckType": truck_type.pk,
            "capacity": capacity.pk,
            "carrier": carrier.pk,
        }
