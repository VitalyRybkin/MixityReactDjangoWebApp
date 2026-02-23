from typing import Any, Dict

from contacts.factories import ContactFactory, PhoneNumberFactory
from contacts.models import Contact
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec


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
        payload = self.payload_generator()
        return self._create_logic(payload)

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in contact creation."""
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        """Test the string representation of a contact object."""
        contact = self.obj
        expected = f"{contact.first_name} {contact.last_name}"
        self._str_method_logic(expected)

    def payload_generator(self) -> Dict[str, Any]:
        temp = self.factory.build()
        phone = PhoneNumberFactory.build()

        return {
            "firstName": temp.first_name,
            "lastName": temp.last_name,
            "email": temp.email,
            "position": temp.position,
            "phoneNumbers": [
                {"phoneNumber": phone.phone_number},
            ],
        }
