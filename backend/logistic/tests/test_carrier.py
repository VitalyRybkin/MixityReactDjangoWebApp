import logging
from typing import Any, Dict

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.models import Carrier
from logistic.tests.factories import CarrierFactory

logger = logging.getLogger(__name__)


class TestCarrierAPIList(BaseAPIMixin):
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

    model = Carrier
    factory = CarrierFactory
    url_name = "carrier_list_create"
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str, required=True, unique=True),
        "fullName": FieldSpec("full_name", str, required=True),
        "address": FieldSpec("address", str),
        "description": FieldSpec("description", str),
        "isActive": FieldSpec("is_active", bool),
    }

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
