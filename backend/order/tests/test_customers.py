from typing import Any, Dict

from contacts.factories import ContactFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec
from order.models import Customer
from order.routes import ConstructionObjectsRoutes, CustomerRoutes
from order.tests.factories import ConstructionObjectFactory, CustomerFactory


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

    def test_active_customer(self) -> None:
        """Test the logic for ensuring active customers are only returned in the list."""
        self._assert_active_only_in_list()

    def test_str_method(self) -> None:
        """Test the string representation of a customer."""
        c = self.obj
        self._str_method_logic(f"Заказчик: {c.name}")

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


class TestCustomerContactsAPI(CustomerBaseTest, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"order_customers:{CustomerRoutes.CONTACTS.name}"

    def test_get_customer_contacts(self) -> None:
        """Test the logic for retrieving contacts associated with a customer."""
        customer_1 = self.factory.create()
        contacts_1 = ContactFactory.create_batch(3, customer=customer_1, carrier=None)
        customer_2 = self.factory.create()
        ContactFactory.create_batch(3, customer=customer_2, carrier=None)

        self._get_object_related_entities_list(
            customer_1.id, contacts_1, entity="contacts"
        )


class TestCustomerConstructionObjectsAPIList(CustomerBaseTest, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"order_customers:{ConstructionObjectsRoutes.LIST_CREATE.name}"

    def test_get_customer_construction_objects(self) -> None:
        """Test the logic for retrieving constructions associated with a customer."""
        customer_1 = self.factory.create()
        constructions_1 = ConstructionObjectFactory.create_batch(3, customer=customer_1)
        ConstructionObjectFactory.create_batch(3, customer=customer_1, is_active=False)

        self._get_object_related_entities_list(
            customer_1.id, constructions_1, entity="construction_objects"
        )


class TestCustomerConstructionObjectsAPIDetailAPI(BaseAPIMixin):
    __test__ = True
    pk_url_name = f"order_customers:{ConstructionObjectsRoutes.DETAIL.name}"
    factory = ConstructionObjectFactory

    def get_url_kwargs(self) -> dict[str, Any]:
        """
        Generate a dictionary of URL keyword arguments.

        Returns
        -------
        dict[str, Any]
            A dictionary containing 'pk' and 'object_pk' as keys, where 'pk' is
            the ID of the associated customer and 'object_pk' is the ID of the
            current object.
        """
        return {
            "pk": self.obj.customer.id,
            "object_pk": self.obj.id,
        }

    def test_retrieve_logic(self) -> None:
        """Test the logic for retrieving a construction object."""
        self._retrieve_object_by_id(
            obj=self.obj,
            pk=self.obj.customer.id,
            object_pk=self.obj.id,
        )
