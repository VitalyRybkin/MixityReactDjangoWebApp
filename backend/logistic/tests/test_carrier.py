import logging
from typing import Any, Dict

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.models import Carrier
from logistic.tests.factories import CarrierFactory

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

    def payload_generator(self) -> Dict[str, Any]:
        temp_data = self.factory.build()

        payload = {
            "name": temp_data.name,
            "fullName": temp_data.full_name,
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
