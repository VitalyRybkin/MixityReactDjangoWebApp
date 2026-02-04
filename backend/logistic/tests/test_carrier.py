import logging
from typing import Any, Dict

import pytest

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.models import Carrier
from logistic.tests.factories import CarrierFactory, DriverFactory, TruckFactory

logger = logging.getLogger(__name__)


class CarrierBaseTest:
    """
    Serves as a foundation for testing functionality, validation,
    and behaviors of the Carrier model. It provides mappings for fields with
    specifications that include attribute names, types, and constraints. The
    class relies on a specified model and factory to facilitate testing processes.

    Attributes:
        model: The model class associated with the test.
        factory: The factory class utilized for creating model instances during tests.
        fields_map: A dictionary mapping field names to FieldSpec objects, detailing
            attributes such as name, type, and constraints of the model's fields.
    """

    model = Carrier
    factory = CarrierFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str, required=True, unique=True),
        "fullName": FieldSpec("full_name", str, required=True),
        "address": FieldSpec("address", str),
        "description": FieldSpec("description", str),
        "isActive": FieldSpec("is_active", bool),
    }


class TestCarrierAPIList(CarrierBaseTest, BaseAPIMixin):
    """
    Provides automated tests for API endpoints related to listing and
    creating carrier items. Each method ensures specific functionality meets
    expected behavior, including unique and mandatory fields validation and testing
    string method formatting.

    Attributes:
        url_name: A string representing the name of the tested API URL.
    """

    __test__ = True

    url_name = "carrier_list_create"

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
        str_method_output = f"TK: {self.obj.name}"
        self._str_method_logic(str_method_output)

    def test_active_carrier(self) -> None:
        self._assert_active_only_in_list()

    def payload_generator(self) -> Dict[str, Any]:
        temp_data = self.factory.build()

        payload = {
            "name": temp_data.name,
            "fullName": temp_data.full_name,
            "isActive": temp_data.is_active,
        }
        return payload


class TestCarrierRetrieveUpdate(CarrierBaseTest, BaseAPIMixin):
    """
    Provides automated tests for API endpoints related to retrieving and updating
    carrier details. Each method ensures specific functionality meets expected
    behavior, including unique and mandatory fields validation and testing
    string method formatting.

    Attributes:
        url_name: A string representing the name of the tested API URL.
    """

    __test__ = True

    detail_url_name = "carrier_details"

    def test_retrieve_update_logic(self) -> None:
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        self._retrieve_object_by_id_not_found()

    def test_active_carrier_update(self) -> None:
        self._assert_soft_delete_via_delete()

    def test_active_carrier_is_read_only(self) -> None:
        self._assert_is_active_is_read_only()

    def test_str_method(self) -> None:
        carrier = self.obj
        expected = f"TK: {carrier.name}"
        self._str_method_logic(expected)


@pytest.mark.django_db
class TestCarrierResources(BaseAPIMixin):
    """
    Retrieves carrier-related resources, such as trucks and drivers, and ensure that the implemented logic meets
    the expected outcomes. It is built on top of Django's database testing framework, leveraging
    factories to generate test data.

    Attributes:
        detail_url_name: str
            The name of the detail resource URL to be used within the test.
        factory: FactorySubClass
            The factory class responsible for creating carrier test instances.
    """

    __test__ = True
    detail_url_name = "carrier_resources"
    factory = CarrierFactory

    def test_retrieve_resources(self) -> None:
        TruckFactory.create_batch(3, carrier=self.obj)
        DriverFactory.create_batch(2, carrier=self.obj)

        self._get_resources_logic(expected_trucks=3, expected_drivers=2)
