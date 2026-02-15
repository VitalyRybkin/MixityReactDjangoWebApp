from typing import Any, Dict

from catalog.models import AppUnit
from catalog.tests.api.factories import UnitFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec


class UnitBaseTest:
    model = AppUnit
    factory = UnitFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "title": FieldSpec("title", str, required=True),
        "isWeightBased": FieldSpec("is_weight_based", bool, required=True),
        "toKgFactor": FieldSpec("to_kg_factor", float, required=True),
    }


class TestUnitAPIList(UnitBaseTest, BaseAPIMixin):
    __test__ = True

    url_name = "unit_list_create"

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
        unit = self.obj
        self._str_method_logic(unit.title)

    def payload_generator(self) -> Dict[str, Any]:
        temp = self.factory.build()

        return {
            "title": temp.title,
            "isWeightBased": temp.is_weight_based,
            "toKgFactor": temp.to_kg_factor,
        }
