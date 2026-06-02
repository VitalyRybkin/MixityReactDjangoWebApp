from typing import Any, Dict

from contacts.factories import ContactFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from order.models import Client
from order.routes import ClientRoutes
from order.tests.factories import ClientFactory


class ClientBaseTest:

    model = Client
    factory = ClientFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str, unique=True),
        "organization": FieldSpec("organization", str),
        "address": FieldSpec("address", str),
        "email": FieldSpec("email", str),
        "phone": FieldSpec("phone", str),
        "isActive": FieldSpec("is_active", bool),
    }


class TestClientAPIList(ClientBaseTest, BaseAPIMixin):
    __test__ = True
    url_name = f"order_clients:{ClientRoutes.LIST_CREATE.name}"

    def test_get_list(self) -> None:
        """Test the logic for retrieving a list of clients."""
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        """Test the logic for creating a client item."""
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        """Test the logic for ensuring unique fields in client creation."""
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in client creation."""
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        """Test the string representation of a client."""
        c = self.obj
        self._str_method_logic(f"Клиент: {c.name}")

    def test_active_stock(self) -> None:
        """Test the logic for ensuring active clients are only returned in the list."""
        self._assert_active_only_in_list()

    def payload_generator(self) -> Dict[str, Any]:
        """Generates a payload for client creation tests."""
        temp = self.factory.build()

        return {
            "name": temp.name,
            "organization": temp.organization,
            "address": temp.address,
            "phone": str(temp.phone),
            "email": temp.email,
            "is_active": temp.is_active,
        }


class TestClientContacts(ClientBaseTest, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"order_clients:{ClientRoutes.CONTACTS.name}"

    def test_get_client_contacts(self) -> None:
        """Test the logic for retrieving contacts associated with a client."""
        client_1 = self.factory.create()
        contacts_1 = ContactFactory.create_batch(3, client=client_1, carrier=None)
        client_2 = self.factory.create()
        ContactFactory.create_batch(3, client=client_2, carrier=None)

        self._get_object_related_entities_list(
            client_1.id, contacts_1, entity="clients"
        )
