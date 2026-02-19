from typing import Any, Dict

from catalog.models import AppUnit
from catalog.tests.api.factories import UnitFactory
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
    url_name = "catalog:unit_list_create"

    def test_get_list(self) -> None:
        """Test the logic for retrieving a list of units."""
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        """Test the logic for creating a new unit."""
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        """Test the logic for ensuring unique fields in unit creation."""
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in unit creation."""
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        """Test the string representation of a unit."""
        unit = self.obj
        self._str_method_logic(unit.title)

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
    Performs and validatses the operations related to
    retrieving and updating a unit's details. Includes test cases to ensure
    proper logic execution and error handling for unit retrieval and updates.

    Attributes:
        pk_url_name: Specifies the name of the URL used for detailed unit
                         operations.
    """

    __test__ = True
    pk_url_name = "catalog:unit_details"

    def test_retrieve_update_logic(self) -> None:
        """Test the logic for retrieving and updating a unit."""
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        """Test the error handling logic for retrieving a nonexistent unit."""
        self._retrieve_object_by_id_not_found()


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
    url_name = "catalog:unit_list_create"

    def test_fields_validation(self) -> None:
        """Test the field validation logic for unit creation."""
        kg_ok = {"title": "kilogram", "isWeightBased": True, "toKgFactor": 1}
        ton_ok = {"title": "ton", "isWeightBased": True, "toKgFactor": 1000}

        cases = [
            ({**kg_ok, "isWeightBased": False}, 400, "is_weight_based"),
            ({**kg_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (kg_ok, 201, None),
            ({**ton_ok, "isWeightBased": False}, 400, "is_weight_based"),
            ({**ton_ok, "toKgFactor": 10}, 400, "to_kg_factor"),
            (ton_ok, 201, None),
        ]

        self._test_field_validation(cases)
