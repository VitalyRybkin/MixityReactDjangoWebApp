from typing import Any, Dict

from rest_framework import status
from rest_framework.reverse import reverse

from catalog.tests.api.factories import SalePriceHistoryFactory
from catalog.tests.api.test_products import BaseTestPriceHistory
from core.tests.base_test_case import BaseAPIContractMixin, BaseAPIMixin
from core.tests.order_form_access_tests import OrderFormAccessContractMixin
from core.tests.parent_visibility_tests import ParentVisibilityContractMixin
from core.tests.utils import FieldSpec
from order.models import ConstructionObject, Customer
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


class TestCustomerConstructionObjectsAPIList(
    ParentVisibilityContractMixin,
    BaseAPIMixin,
):
    __test__ = True
    model = ConstructionObject
    factory = ConstructionObjectFactory
    pk_url_name = f"order_customers:{ConstructionObjectsRoutes.LIST_CREATE.name}"

    def _get_parent(self) -> Customer:
        return self.obj.customer

    def _assert_create_for_customer_returns_404(
            self,
            customer_id: int,
            case: str,
    ) -> None:
        url = reverse(
            self.pk_url_name,
            kwargs={"pk": customer_id},
        )

        self._logger_header(f"ENDPOINT POST: {url}")

        payload = {
            "name": "Test construction object",
            "address": "Test address",
        }

        count_before = ConstructionObject.objects.count()

        response = self.client.post(
            url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            ConstructionObject.objects.count(),
            count_before,
        )

        self._logger_success(
            case,
            f"HTTP {response.status_code}",
        )

    def test_get_customer_construction_objects(self) -> None:
        """Test the logic for retrieving constructions associated with a customer."""
        customer_1 = CustomerFactory.create()
        constructions_1 = self.factory.create_batch(3, customer=customer_1)
        self.factory.create_batch(3, customer=customer_1, is_active=False)

        self._get_object_related_entities_list(
            customer_1.id, constructions_1, entity="construction_objects"
        )

    def test_creating_item_logic(self) -> None:
        """Test the logic for creating a customer item."""
        payload = self.payload_generator()
        self._create_logic(payload, pk=payload["customer"])

    def test_str_method(self) -> None:
        """Test the string representation of a customer."""
        self._str_method_logic(self.obj.name)

    def payload_generator(self) -> Dict[str, Any]:
        """Generates a payload for customer creation tests."""
        temp = self.factory.create()

        return {
            "id": temp.id,
            "customer": temp.customer.id,
            "name": temp.name,
            "address": temp.address,
            "is_active": temp.is_active,
        }

    def test_create_for_inactive_customer_returns_404(self) -> None:
        customer = CustomerFactory.create(is_active=False)

        self._assert_create_for_customer_returns_404(
            customer.id,
            "Inactive customer rejected",
        )

    def test_create_for_nonexistent_customer_returns_404(self) -> None:
        self._assert_create_for_customer_returns_404(
            999999,
            "Nonexistent customer rejected",
        )


class TestCustomerConstructionObjectsAPIDetailAPI(
    ParentVisibilityContractMixin,
    BaseAPIMixin,
):
    __test__ = True
    pk_url_name = f"order_customers:{ConstructionObjectsRoutes.DETAIL.name}"
    factory = ConstructionObjectFactory

    permission_model = ConstructionObject

    def _get_parent(self) -> Customer:
        return self.obj.customer

    def _get_parent_url_kwargs(
        self,
        parent_pk: int,
    ) -> dict[str, Any]:
        return {
            "pk": parent_pk,
            "object_pk": self.obj.id,
        }

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

    def test_object_from_another_customer_returns_404(self) -> None:
        """Test the logic for retrieving a construction object from another customer."""

        self._logger_header("TEST: retrieve object from another customer")
        another_customer = CustomerFactory.create()

        url = reverse(
            self.pk_url_name,
            kwargs={
                "pk": another_customer.id,
                "object_pk": self.obj.id,
            },
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Object from another customer rejected | HTTP 404"
            f"{self.COLOR['END']}"
        )

    def test_inactive_construction_object_returns_404(self) -> None:
        """Test inactive construction object returns 404."""
        self._assert_inactive_object_returns_404()


class TestCustomerPriceHistory(
    BaseTestPriceHistory,
    OrderFormAccessContractMixin,
    BaseAPIContractMixin,
):
    """
    TestCustomerPriceHistory is a test class for validating customer price history functionality.

    Attributes:
        pk_url_name (str): The name of the primary key URL route for accessing customer price history.
        factory: Factory instance for generating price history test data.
        price_context_factory: Factory for creating customer-related test data.
        context_field (str): The field name used to associate price history with the customer.
    """

    __test__ = True
    pk_url_name = f"order_customers:{CustomerRoutes.PRICES.name}"
    factory = SalePriceHistoryFactory
    price_context_factory = CustomerFactory
    context_field = "customer"
