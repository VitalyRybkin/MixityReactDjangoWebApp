from typing import Any, Dict

from contacts.factories import ContactFactory, PhoneNumberFactory
from contacts.models import Contact
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from logistic.tests.factories import CarrierFactory
from stock.tests.factories import WarehouseFactory


class TestContactAPICreate(BaseAPIMixin):
    __test__ = True

    model = Contact
    factory = ContactFactory
    url_name = "contacts:create_contact"

    fields_map = {
        "id": FieldSpec("id", int),
        "firstName": FieldSpec("first_name", str, required=True),
        "lastName": FieldSpec("last_name", str),
        "email": FieldSpec("email", str),
        "position": FieldSpec("position", str),
    }

    def test_create_contact(self) -> None:
        """Test that we can create a new contact."""
        temp_factories = [
            self.factory.build(carrier=CarrierFactory.create(), warehouse=None),
            self.factory.build(warehouse=WarehouseFactory.create(), carrier=None),
        ]
        for temp in temp_factories:
            field_name = "CARRIER" if temp.carrier else "WAREHOUSE"

            print(
                f"\n{self.COLOR['OK']}▶ Testing: create CONTACT with {self.COLOR['OK']}{field_name}"
                f"{self.COLOR['END']}:",
                end=" ",
            )
            payload = self.payload_generator(temp)
            self._create_logic(payload)

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in contact creation."""
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        """Test the string representation of a contact object."""
        contact = self.obj
        expected = f"{contact.first_name} {contact.last_name}"
        self._str_method_logic(expected)

    def test_invalid_xor_both(self) -> None:
        """Test that we can't create a contact with both a carrier and warehouse."""
        carrier = CarrierFactory.create()
        warehouse = WarehouseFactory.create()

        temp = self.factory.build()
        payload = self.payload_generator(temp)
        payload.update({"carrier": carrier.id, "warehouse": warehouse.id})
        print(
            f"\n{self.COLOR['OK']}▶ Testing: create CONTACT with {self.COLOR['OK']}both CARRIER and WAREHOUSE"
            f"{self.COLOR['END']}:",
            end=" ",
        )
        self._create_invalid_xor_both(payload)

    def payload_generator(self, temp: Any = None) -> Dict[str, Any]:
        if temp is None:
            temp = self.factory.build(carrier=CarrierFactory.create(), warehouse=None)

        phone = PhoneNumberFactory.build()
        return {
            "firstName": temp.first_name,
            "lastName": temp.last_name,
            "email": temp.email,
            "position": temp.position,
            "phoneNumbers": [{"phoneNumber": phone.phone_number}],
            "carrier": getattr(temp.carrier, "id", None),
            "warehouse": getattr(temp.warehouse, "id", None),
        }
