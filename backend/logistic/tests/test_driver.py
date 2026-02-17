from typing import Any, Dict

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.models import Carrier, Driver
from logistic.tests.factories import CarrierFactory, DriverFactory


class DriverBaseTest:
    """
    Provides a foundation for testing the `Driver` model and its related
    factory. It includes mappings for fields and their specifications, enabling
    structured and consistent testing across the model's features.

    Attributes:
        model: A reference to the `Driver` class representing the model being tested.
        factory: The factory class used to create instances of the `Driver` model
            during testing.
        fields_map: A dictionary mapping field names to their specifications,
            represented by `FieldSpec` objects. Each field specification may include
            properties such as the field ID, its type, and whether it is required.
    """

    model = Driver
    factory = DriverFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "carrier": FieldSpec("carrier", Carrier, required=True),
        "fullName": FieldSpec("full_name", str, required=True),
        "phone": FieldSpec("phone", str),
        "passportNumber": FieldSpec("passport_number", str),
        "passportIssueDate": FieldSpec("passport_issue_date", str),
        "passportEmittedBy": FieldSpec("passport_emitted_by", str),
    }


class TestDriverAPIList(DriverBaseTest, BaseAPIMixin):
    url_name = "logistic:driver_list_create"

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
        driver = self.obj
        expected = f"Водитель: {driver.full_name}, {driver.carrier}, {driver.phone}"
        self._str_method_logic(expected)

    def payload_generator(self) -> Dict[str, Any]:
        carrier = CarrierFactory.create()

        temp = self.factory.build()

        return {
            "fullName": temp.full_name,
            "phone": temp.phone,
            "passportNumber": temp.passport_number,
            "passportIssueDate": temp.passport_issue_date,
            "passportEmittedBy": temp.passport_emitted_by,
            "carrier": carrier.pk,
        }
