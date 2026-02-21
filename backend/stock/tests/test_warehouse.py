from typing import Any, Dict

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec, UploadSpec
from stock.models import Warehouse
from stock.tests.factories import WarehouseFactory, WarehouseMapFactory


class WarehouseBaseTest:
    """
    Provides a foundation for testing the Warehouse model and its related
    components. Includes references to the model and its factory, as well as a mapping
    of field specifications, which provides the expected field names and their types.
    """

    model = Warehouse
    factory = WarehouseFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str),
        "address": FieldSpec("address", str),
        "organization": FieldSpec("organization", str),
        "phoneNumber": FieldSpec("phone_number", str),
    }


class TestWarehouseAPIList(WarehouseBaseTest, BaseAPIMixin):
    """
    Provides a series of test cases to verify the proper functioning
    of the API endpoints for listing and creating warehouse items. Ensures
    the integrity of unique fields, mandatory fields, and other fundamental
    behavior of the API. By integrating various test logics, the class helps
    maintain the reliability and consistency of the warehouse-related API
    operations.

    Attributes:
        url_name: The URL name for the warehouse list and create API endpoint.
        model: The model class for warehouse objects.

    """

    __test__ = True

    url_name = "stock:warehouse_list_create"

    def test_get_list(self) -> None:
        """Test the logic for retrieving a list of warehouses."""
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        """Test the logic for creating a warehouse item."""
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        """Test the logic for ensuring unique fields in warehouse creation."""
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in warehouse creation."""
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        """Test the string representation of a warehouse."""
        wh = self.obj
        self._str_method_logic(f"{wh.name} - {wh.address}")

    def payload_generator(self) -> Dict[str, Any]:
        """Generates a payload for warehouse creation tests."""
        temp = self.factory.build()

        return {
            "name": temp.name,
            "organization": temp.organization,
            "address": temp.address,
            "phoneNumber": temp.phone_number,
            "directions": None,
        }


class TestWarehouseRetrieveUpdate(WarehouseBaseTest, BaseAPIMixin):
    """
    Test cases to validate the functionality of retrieving
    and updating warehouse details in the system. Extends the necessary base
    classes to ensure proper test environment setup and API mixin utility support.

    Attributes:
        url_name: The URL name for the warehouse detail API endpoint.
    """

    __test__ = True
    pk_url_name = "stock:warehouse_details"

    def test_retrieve_update_logic(self) -> None:
        """Test the logic for retrieving and updating warehouse details."""
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        """Test the error handling logic for retrieving a nonexistent warehouse."""
        self._retrieve_object_by_id_not_found()


class TestWarehouseUploadMap(BaseAPIMixin):

    __test__ = True
    pk_url_name = "stock:warehouse_map"
    upload_file_spec = UploadSpec(field_name="directions", upload_to="maps/")

    model = Warehouse
    factory = WarehouseMapFactory
    fields_map = {
        "directions": FieldSpec("directions", str),
    }

    def test_upload_map(self) -> None:
        temp = self.factory.build()
        return self._upload_map_success(
            {"directions": temp.directions}, self.upload_file_spec
        )

    def test_upload_map_missing_file_400(self) -> None:
        return self._upload_map_missing_file_400(self.upload_file_spec)
