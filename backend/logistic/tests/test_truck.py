import logging
import uuid
from decimal import Decimal
from typing import Any, Dict

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.models import TruckCapacity, TruckType
from logistic.tests.factories import TruckCapacityFactory, TruckTypeFactory

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
        "truckType": FieldSpec("type", str, required=True, unique=True),
        "description": FieldSpec("description", str),
    }


class TestTruckTypeAPIList(TruckTypeBaseTest, BaseAPIMixin):
    """
    Provides test cases to verify the behavior of list, create, and validation
    operations on Truck Types via the Truck Types API. It ensures correctness of fetching,
    creation, uniqueness constraints, mandatory fields validation, and string representation
    of truck types.

    Attributes:
        url_name: URL name for the truck types API endpoint.
    """

    __test__ = True

    url_name = "truck_types_list_create"

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
        str_method_output = f"Тип ТС - {self.obj.type}"
        self._str_method_logic(str_method_output)

    def payload_generator(self) -> Dict[str, Any]:
        temp_data = self.factory.build()

        payload = {
            "truckType": temp_data.type,
            "description": temp_data.description,
        }
        return payload


class TruckTypeTestRetrieveUpdate(TruckTypeBaseTest, BaseAPIMixin):
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

    detail_url_name = "truck_types_details"

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

    url_name = "truck_capacities_list_create"

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


class TruckCapacityRetrieveUpdate(TruckCapacityBaseTest, BaseAPIMixin):
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

    detail_url_name = "truck_capacities_details"

    def test_retrieve_update_logic(self) -> None:
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        self._retrieve_object_by_id_not_found()
