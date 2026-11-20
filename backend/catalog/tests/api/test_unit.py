from typing import Any, Dict

from catalog.api.routes import UnitRoutes
from catalog.api.serializers.unit_serializers import UnitSerializer
from catalog.models import AppUnit
from catalog.tests.api.factories import UnitFactory
from catalog.utils.unit_choices import TitleChoices
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec


class UnitBaseTest:
    """
    Defines tests and validate various attributes
    and properties of the 'AppUnit' model. Includes a field mapping
    specification for verifying the structure and requirements of the
    model fields and offers a framework for consistency in tests.

    Attributes:
        model: A reference to the model class being tested, which is 'AppUnit'.
        factory: A reference to the factory class used for creating test data,
            which is 'UnitFactory'.
        fields_map: A mapping that defines the fields of the model being tested,
            including their names, types, and requirements.
    """

    model = AppUnit
    factory = UnitFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "title": FieldSpec("title", str, required=True),
        "isWeightBased": FieldSpec("is_weight_based", bool, required=True),
        "toKgFactor": FieldSpec("to_kg_factor", float, required=True),
    }

    def get_serializer(self) -> UnitSerializer:
        """Provide get serializer for the test contract."""
        return UnitSerializer()


class TestUnitAPIList(UnitBaseTest, BaseAPIMixin):
    """
    Provides unit test implementations for testing API list,
    creation logic, unique field validations, mandatory field validations,
    and string representation of objects. It extends from UnitBaseTest and
    BaseAPIMixin to utilize their functionalities.

    Attributes:
        url_name: The URL name for the unit list and create API endpoint.
    """

    __test__ = True
    url_name = f"catalog:{UnitRoutes.LIST_CREATE.name}"

    def test_get_list(self) -> None:
        """Test the logic for retrieving a list of units."""
        self._logger_header("UNIT APILIST: GET LIST")
        self._get_list_logic()
        self._logger_success(
            "get_list", "Verify the list response matches the expected resource fields"
        )

    def test_creating_item_logic(self) -> None:
        """Test the logic for creating a new unit."""
        self._logger_header("UNIT APILIST: CREATING ITEM LOGIC")
        payload = self.payload_generator()
        self._create_logic(payload)
        self._logger_success(
            "creating_item_logic", "Verify valid input creates a resource"
        )

    def test_item_unique_fields(self) -> None:
        """Test the logic for ensuring unique fields in unit creation."""
        self._logger_header("UNIT APILIST: ITEM UNIQUE FIELDS")
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)
        self._logger_success(
            "item_unique_fields", "Reject duplicate values for unique fields"
        )

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in unit creation."""
        self._logger_header("UNIT APILIST: ITEM MANDATORY FIELDS")
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)
        self._logger_success(
            "item_mandatory_fields", "Reject requests that omit required fields"
        )

    def test_str_method(self) -> None:
        """Test the string representation of a unit."""
        self._logger_header("UNIT APILIST: STR METHOD")
        unit = self.obj
        self._str_method_logic(unit.title)
        self._logger_success("str_method", "Verify the model string representation")

    def payload_generator(self) -> Dict[str, Any]:
        """Generate a payload for unit creation tests."""
        temp = self.factory.build()

        return {
            "title": temp.title,
            "isWeightBased": temp.is_weight_based,
            "toKgFactor": temp.to_kg_factor,
        }


class TestUnitRetrieveUpdate(UnitBaseTest, BaseAPIMixin):
    """
    Performs and validates the operations related to
    retrieving and updating a unit's details. Includes test cases to ensure
    proper logic execution and error handling for unit retrieval.

    Attributes:
        pk_url_name: Specifies the name of the URL used for detailed unit
                         operations.
    """

    __test__ = True
    pk_url_name = f"catalog:{UnitRoutes.DETAIL.name}"

    def test_retrieve_logic(self) -> None:
        """Test the logic for retrieving a unit."""
        self._logger_header("UNIT RETRIEVE UPDATE: RETRIEVE LOGIC")
        self._retrieve_object_by_id()
        self._logger_success("retrieve_logic", "Verify retrieve logic")

    def test_update_logic(self) -> None:
        """Test the logic for updating a unit."""
        self._logger_header("UNIT RETRIEVE UPDATE: UPDATE LOGIC")
        payload = {
            "to_kg_factor": 1000,
        }
        self._patch_logic_success(payload)
        self._logger_success("update_logic", "Verify update logic")

    def test_update_logic_failed(self) -> None:
        """Verify update logic failed."""
        self._logger_header("UNIT RETRIEVE UPDATE: UPDATE LOGIC FAILED")
        self.obj.title = TitleChoices.KILOGRAM
        self.obj.is_weight_based = True
        self.obj.to_kg_factor = 1
        self.obj.save()

        payload = {
            "isWeightBased": False,
        }

        self._patch_logic_failed(
            obj=self.obj,
            payload=payload,
            expected_field="is_weight_based",
        )
        self._logger_success("update_logic_failed", "Verify update logic failed")

    def test_not_found_error(self) -> None:
        """Test the error handling logic for retrieving a nonexistent unit."""
        self._logger_header("UNIT RETRIEVE UPDATE: NOT FOUND ERROR")
        self._retrieve_object_by_id_not_found()
        self._logger_success(
            "not_found_error", "Return HTTP 404 for a nonexistent resource"
        )


class TestUnitFiledValidation(UnitBaseTest, BaseAPIMixin):
    """
    Provides unit test implementations for testing API list,
    creation logic, unique field validations, mandatory field validations,
    and string representation of objects. It extends from UnitBaseTest and
    BaseAPIMixin to utilize their functionalities.

    Attributes:
        url_name: The URL name for the unit list and create API endpoint.
    """

    __test__ = True
    url_name = f"catalog:{UnitRoutes.LIST_CREATE.name}"

    def test_fields_validation(self) -> None:
        """Test the field validation logic for unit creation."""
        self._logger_header("UNIT FILED VALIDATION: FIELDS VALIDATION")
        kg_ok = {"title": "kilogram", "isWeightBased": True, "toKgFactor": 1}
        ton_ok = {"title": "ton", "isWeightBased": True, "toKgFactor": 1000}
        piece_ok = {"title": "piece", "isWeightBased": False, "toKgFactor": 1}
        pallet_ok = {"title": "pallet", "isWeightBased": False, "toKgFactor": 1}
        percent_ok = {"title": "%", "isWeightBased": False, "toKgFactor": 1}
        millimeter_ok = {"title": "millimeter", "isWeightBased": False, "toKgFactor": 1}
        megapascal_ok = {"title": "megapascal", "isWeightBased": False, "toKgFactor": 1}
        litre_ok = {"title": "litre", "isWeightBased": False, "toKgFactor": 1}
        kg_per_m3_ok = {"title": "kg/m3", "isWeightBased": False, "toKgFactor": 1}

        cases = [
            ({**kg_ok, "isWeightBased": False}, 400, "is_weight_based"),
            ({**kg_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (kg_ok, 201, None),
            ({**ton_ok, "isWeightBased": False}, 400, "is_weight_based"),
            ({**ton_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (ton_ok, 201, None),
            ({**piece_ok, "isWeightBased": True}, 400, "is_weight_based"),
            ({**piece_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (piece_ok, 201, None),
            ({**pallet_ok, "isWeightBased": True}, 400, "is_weight_based"),
            ({**pallet_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (pallet_ok, 201, None),
            ({**percent_ok, "isWeightBased": True}, 400, "is_weight_based"),
            ({**percent_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (percent_ok, 201, None),
            ({**millimeter_ok, "isWeightBased": True}, 400, "is_weight_based"),
            ({**millimeter_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (millimeter_ok, 201, None),
            ({**megapascal_ok, "isWeightBased": True}, 400, "is_weight_based"),
            ({**megapascal_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (megapascal_ok, 201, None),
            ({**litre_ok, "isWeightBased": True}, 400, "is_weight_based"),
            ({**litre_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (litre_ok, 201, None),
            ({**kg_per_m3_ok, "isWeightBased": True}, 400, "is_weight_based"),
            ({**kg_per_m3_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (kg_per_m3_ok, 201, None),
        ]

        self._test_field_validation(cases)
        self._logger_success("fields_validation", "Verify fields validation")
