from typing import Any, Dict

from contacts.factories import ContactFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from order.models import Customer
from order.routes import CustomerRoutes
from order.tests.factories import CustomerFactory


class CustomerBaseTest:

    model = Customer
    factory = CustomerFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str, unique=True),
        "organization": FieldSpec("organization", str),
        "address": FieldSpec("address", str),
        "email": FieldSpec("email", str),
        "phone": FieldSpec("phone", str),
        "isActive": FieldSpec("is_active", bool),
    }


class TestCustomerAPIList(CustomerBaseTest, BaseAPIMixin):
    __test__ = True
    url_name = f"order_customers:{CustomerRoutes.LIST_CREATE.name}"

    def test_get_list(self) -> None:
        """Test the logic for retrieving a list of customers."""
        self._get_list_logic()

    def test_creating_item_logic(self) -> None:
        """Test the logic for creating a customer item."""
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        """Test the logic for ensuring unique fields in customer creation."""
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in customer creation."""
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        """Test the string representation of a customer."""
        c = self.obj
        self._str_method_logic(f"Заказчик: {c.name}")

    def test_active_stock(self) -> None:
        """Test the logic for ensuring active customers are only returned in the list."""
        self._assert_active_only_in_list()

    def payload_generator(self) -> Dict[str, Any]:
        """Generates a payload for customer creation tests."""
        temp = self.factory.build()

        return {
            "name": temp.name,
            "organization": temp.organization,
            "address": temp.address,
            "phone": str(temp.phone),
            "email": temp.email,
            "is_active": temp.is_active,
        }


class TestCustomerContacts(CustomerBaseTest, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"order_customers:{CustomerRoutes.CONTACTS.name}"

    def test_get_customer_contacts(self) -> None:
        """Test the logic for retrieving contacts associated with a customer."""
        customer_1 = self.factory.create()
        contacts_1 = ContactFactory.create_batch(3, customer=customer_1, carrier=None)
        customer_2 = self.factory.create()
        ContactFactory.create_batch(3, customer=customer_2, carrier=None)

        self._get_contact_list(customer_1.id, contacts_1)
