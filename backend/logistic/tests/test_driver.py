from typing import Any, Dict

from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.models import Carrier, Driver
from logistic.routes import DriverRoutes
from logistic.serializers.driver_serializers import DriverSerializer
from logistic.tests.factories import CarrierFactory, DriverFactory


class DriverBaseTest:
    """
    Provides a foundation for testing the `Driver` model and its related
    factory. It includes mappings for fields and their specifications, enabling
    structured and consistent testing across the model's features.
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
    """
    Tests for the Driver API list endpoint.
    """

    url_name = f"logistic:{DriverRoutes.LIST_CREATE.name}"

    __test__ = True

    def get_serializer(self) -> DriverSerializer:
        return DriverSerializer()

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

    def test_create_with_inactive_carrier_returns_400(self) -> None:
        self._logger_header("RELATED VALIDATION: inactive carrier on driver create")
        self._assert_create_with_inactive_related_returns_400(
            payload=self.payload_generator(),
            field_name="carrier",
            related_factory=CarrierFactory,
        )

    def payload_generator(self) -> Dict[str, Any]:
        carrier = CarrierFactory.create()

        temp = self.factory.build()

        return {
            "fullName": temp.full_name,
            "phone": str(temp.phone),
            "passportNumber": temp.passport_number,
            "passportIssueDate": temp.passport_issue_date,
            "passportEmittedBy": temp.passport_emitted_by,
            "carrier": carrier.pk,
        }
