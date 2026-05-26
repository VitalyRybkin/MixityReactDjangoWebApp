import datetime
from typing import Any, Dict

from catalog.models import PurchasePriceHistory
from catalog.tests.api.factories import ProductFactory, PurchasePriceHistoryFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec, UploadSpec
from stock.models import Warehouse
from stock.routes import WarehouseRoutes
from stock.tests.factories import WarehouseFactory, WarehouseMapFactory
from stock.warehouse_serializers import WarehouseListCreateSerializer


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
        "name": FieldSpec("name", str, required=True, unique=True),
        "address": FieldSpec("address", str),
        "organization": FieldSpec("organization", str),
        "phone": FieldSpec("phone", str),
        "isActive": FieldSpec("is_active", bool),
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

    url_name = f"stock:{WarehouseRoutes.LIST_CREATE.name}"

    def get_serializer(self) -> WarehouseListCreateSerializer:
        return WarehouseListCreateSerializer()

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

    def test_active_stock(self) -> None:
        """Test the logic for ensuring active warehouses are only returned in the list."""
        self._assert_active_only_in_list()

    def payload_generator(self) -> Dict[str, Any]:
        """Generates a payload for warehouse creation tests."""
        temp = self.factory.build()

        return {
            "name": temp.name,
            "organization": temp.organization,
            "address": temp.address,
            "phone": str(temp.phone),
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
    pk_url_name = f"stock:{WarehouseRoutes.DETAIL.name}"

    def test_retrieve_update_logic(self) -> None:
        """Test the logic for retrieving and updating warehouse details."""
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        """Test the error handling logic for retrieving a nonexistent warehouse."""
        self._retrieve_object_by_id_not_found()


class TestWarehouseUploadMap(BaseAPIMixin):
    """
    Implements test cases for uploading map files in the warehouse
    module.

    Attributes:
        pk_url_name: Identifier for the URL name related to warehouse mapping.
        upload_file_spec: Specification for the upload file field used for
                          warehouse maps.
        model: Data model associated with this test, representing the
               warehouse entity.
        factory: Factory responsible for generating test data associated
                 with the warehouse map.
        fields_map: Specification for mapping fields between the model
                    and upload functionality.
    """

    __test__ = True
    pk_url_name = f"stock:{WarehouseRoutes.MAP.name}"
    upload_file_spec = UploadSpec(field_name="directions", upload_to="maps/")

    model = Warehouse
    factory = WarehouseMapFactory
    fields_map = {
        "directions": FieldSpec("directions", str),
    }

    def test_upload_map(self) -> None:
        """
        Test the successful upload of a warehouse map file.
        """
        temp = self.factory.build()
        return self._upload_map_success(
            {"directions": temp.directions}, self.upload_file_spec
        )

    def test_upload_map_missing_file_400(self) -> None:
        """
        Test that uploading a warehouse map without a file returns a 400 Bad Request.
        """
        return self._upload_map_missing_file_400(self.upload_file_spec)


class TestWarehousePriceHistory(BaseAPIMixin):
    """
    Implements test cases for the purchase price history functionality in the warehouse module.

    Attributes:
        pk_url_name: Identifier for the URL name related to warehouse price history.
        model: Data model associated with this test, representing the purchase price history entity.
        factory: Factory responsible for generating test data associated with the purchase price history.
    """

    __test__ = True
    pk_url_name = f"stock:{WarehouseRoutes.PRICES.name}"

    model = PurchasePriceHistory
    factory = PurchasePriceHistoryFactory

    def test_latest_purchase_price(self) -> None:
        """
        Test retrieval of the latest purchase price for a product in a warehouse.
        """
        warehouse = WarehouseFactory.create()
        product = ProductFactory.create()

        latest_price_date = datetime.date.today()
        price_a_date_before = latest_price_date - datetime.timedelta(days=1)

        self.factory.create(
            warehouse=warehouse,
            product=product,
            date=price_a_date_before,
        )
        price_to_get = self.factory.create(
            warehouse=warehouse,
            product=product,
            date=latest_price_date,
        )

        self._get_latest_price(warehouse.id, product.id, price_to_get)

    def test_latest_purchase_price_invalid_ids(self) -> None:
        """
        Test retrieval of the latest purchase price with invalid productIDs.
        """
        warehouse_id = 2
        invalid_product_id = "not-an-integer"

        self._get_latest_price_invalid_product_id(warehouse_id, invalid_product_id)
