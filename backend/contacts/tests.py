from typing import Any, Dict, List

from rest_framework import status

from contacts.factories import ContactFactory, PhoneNumberFactory
from contacts.models import Contact, PhoneNumber
from contacts.routes import ContactRoutes
from contacts.serializers import ContactSerializer
from contacts.views import ContactListCreateAPIView
from core.tests.base_test_case import BaseAPIMixin
from core.tests.base_view_test_case import BaseQuerysetTestCase
from core.tests.parent_visibility_tests import ParentVisibilityContractMixin
from core.tests.utils import FieldSpec
from logistic.routes import CarrierRoutes
from logistic.tests.factories import CarrierFactory
from order.routes import ClientRoutes, CustomerRoutes
from order.tests.factories import ClientFactory, CustomerFactory
from stock.routes import WarehouseRoutes
from stock.tests.factories import WarehouseFactory


def _extract_phone_numbers_from_db(obj: Any) -> List[str]:
    return list(obj.phone_numbers.values_list("phone_number", flat=True))


def _extract_phone_numbers_from_payload(payload: Dict[str, Any]) -> List[str]:
    return [item["phoneNumber"] for item in payload["phoneNumbers"]]


class TestContactAPICreate(BaseAPIMixin):
    __test__ = True

    model = Contact
    factory = ContactFactory
    url_name = f"contacts:{ContactRoutes.LIST_CREATE.name}"

    fields_map = {
        "id": FieldSpec("id", int),
        "firstName": FieldSpec("first_name", str, required=True),
        "lastName": FieldSpec("last_name", str),
        "email": FieldSpec("email", str),
        "position": FieldSpec("position", str),
    }

    def get_serializer(self) -> ContactSerializer:
        return ContactSerializer()

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
        expected = f"Контакт: {contact.first_name} {contact.last_name}"
        self._str_method_logic(expected)

    def test_invalid_xor_both(self) -> None:
        """Test that we can't create a contact with both a carrier and warehouse."""
        carrier = CarrierFactory.create()
        warehouse = WarehouseFactory.create()
        client = ClientFactory.create()
        customer = CustomerFactory.create()

        temp = self.factory.build()
        payload = self.payload_generator(temp)
        payload.update(
            {
                "carrier": carrier.id,
                "warehouse": warehouse.id,
                "client": client.id,
                "customer": customer.id,
            }
        )
        print(
            f"\n{self.COLOR['OK']}▶ Testing: create CONTACT with {self.COLOR['OK']}both CARRIER and WAREHOUSE"
            f"{self.COLOR['END']}:",
            end=" ",
        )
        self._create_invalid_xor_both(payload)

    def test_phone_numbers_validation(self) -> None:
        payload = {
            "firstName": "Zachary",
            "phoneNumbers": [
                {"phoneNumber": "+79219212121"},
                {"phoneNumber": "+79219212121"},
            ],
        }

        pn_cases = [
            (payload, 400, "Номера телефонов не должны дублироваться."),
        ]

        self._test_nested_field_validation(pn_cases, "phoneNumbers")

    def test_unique_phone_numbers(self) -> None:
        payload = self.payload_generator()

        contact = self.factory.create(
            first_name=payload["firstName"],
        )

        for item in payload["phoneNumbers"]:
            PhoneNumber.objects.create(
                contact=contact,
                phone_number=item["phoneNumber"],
            )

        self._test_unique_fields(
            payload, "Номера телефонов: Такой номер телефона уже существует."
        )

    def test_update_should_allow_same_phone_numbers(self) -> None:
        payload = self.payload_generator()

        contact = self.factory.create(
            first_name=payload["firstName"],
            last_name=payload.get("lastName"),
        )

        for item in payload["phoneNumbers"]:
            PhoneNumber.objects.create(
                contact=contact,
                phone_number=item["phoneNumber"],
            )

        self._test_update_should_preserve_same_values(
            payload,
            contact,
            db_extractor=_extract_phone_numbers_from_db,
            payload_extractor=_extract_phone_numbers_from_payload,
        )

    def test_update_should_fail_if_phone_belongs_to_another_contact(self) -> None:
        payload = self.payload_generator()

        contact1 = self.factory.create(first_name=payload["firstName"])
        for item in payload["phoneNumbers"]:
            PhoneNumber.objects.create(
                contact=contact1,
                phone_number=item["phoneNumber"],
            )

        contact2 = self.factory.create(first_name="Another")

        self._test_update_should_fail_on_repeated_field_value(
            payload, contact2, expected_error="Такой номер телефона уже существует."
        )

    def test_create_with_inactive_parent_returns_400(self) -> None:
        cases = [
            ("carrier", CarrierFactory),
            ("warehouse", WarehouseFactory),
            ("client", ClientFactory),
            ("customer", CustomerFactory),
        ]

        for field_name, factory in cases:
            with self.subTest(field=field_name):
                parent = factory.create(is_active=False)

                payload = {
                    "firstName": "Test",
                    field_name: parent.pk,
                }

                count_before = Contact.objects.count()

                response = self.client.post(
                    self.url,
                    data=payload,
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                    response.data,
                )
                self.assertEqual(
                    Contact.objects.count(),
                    count_before,
                )

    def payload_generator(self, temp: Any = None) -> Dict[str, Any]:
        if temp is None:
            temp = self.factory.build(carrier=CarrierFactory.create(), warehouse=None)

        phone = PhoneNumberFactory.build()
        return {
            "firstName": temp.first_name,
            "lastName": temp.last_name,
            "email": temp.email,
            "position": temp.position,
            "phoneNumbers": [{"phoneNumber": str(phone.phone_number)}],
            "carrier": getattr(temp.carrier, "id", None),
            "warehouse": getattr(temp.warehouse, "id", None),
        }


class TestContactAPIDelete(BaseAPIMixin):
    __test__ = True

    model = Contact
    factory = ContactFactory
    pk_url_name = f"contacts:{ContactRoutes.DETAIL.name}"

    def test_delete_contact(self) -> None:
        self._delete_logic(expected_status=204)


class TestContactListCreateAPIView(BaseQuerysetTestCase):
    _factory = ContactFactory
    _view_class = ContactListCreateAPIView

    def test_queryset_contract(self) -> None:
        self._factory.create_batch(3)

        self._assert_queryset_contract(
            expected_prefetches=["phone_numbers"],
        )


class TestCarrierContactsAPIList(ParentVisibilityContractMixin, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"logistic:{CarrierRoutes.CONTACTS.name}"
    factory = CarrierFactory
    permission_model = Contact

    def test_get_list(self) -> None:
        ContactFactory.create_batch(3, carrier=self.obj)
        self._get_pk_list_logic(expected_contacts=3)


class TestWarehouseContactsAPIList(ParentVisibilityContractMixin, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"stock:{WarehouseRoutes.CONTACTS.name}"
    factory = WarehouseFactory
    permission_model = Contact

    def test_get_list(self) -> None:
        ContactFactory.create_batch(
            3, warehouse=self.obj, carrier=None, client=None, customer=None
        )
        self._get_pk_list_logic(expected_contacts=3)


class TestClientContactsAPIList(ParentVisibilityContractMixin, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"order_clients:{ClientRoutes.CONTACTS.name}"
    factory = ClientFactory
    permission_model = Contact

    def test_get_list(self) -> None:
        ContactFactory.create_batch(
            3, client=self.obj, carrier=None, warehouse=None, customer=None
        )
        self._get_pk_list_logic(expected_contacts=3)


class TestCustomerContactsAPIList(ParentVisibilityContractMixin, BaseAPIMixin):
    __test__ = True
    pk_url_name = f"order_customers:{CustomerRoutes.CONTACTS.name}"
    factory = CustomerFactory
    permission_model = Contact

    def test_get_list(self) -> None:
        ContactFactory.create_batch(
            3, client=None, carrier=None, warehouse=None, customer=self.obj
        )
        self._get_pk_list_logic(expected_contacts=3)
