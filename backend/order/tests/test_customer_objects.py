from typing import Dict, Any

from rest_framework import status
from rest_framework.reverse import reverse

from core.tests.base_test_case import BaseAPIMixin
from order.models import ConstructionObject, Customer
from order.routes import ConstructionObjectsRoutes
from order.tests.factories import ConstructionObjectFactory, CustomerFactory


class TestCustomerConstructionObjectsAPIList(
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

    def test_inactive_parent_returns_404(self) -> None:
        self._inactive_parent_visibility_logic()

    def test_nonexistent_parent_returns_404(self) -> None:
        self._nonexistent_parent_visibility_logic()

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

    def test_inactive_parent_returns_404(self) -> None:
        self._inactive_parent_visibility_logic()

    def test_nonexistent_parent_returns_404(self) -> None:
        self._nonexistent_parent_visibility_logic()

    def test_retrieve_logic(self) -> None:
        """Test the logic for retrieving a construction object."""
        self._retrieve_object_by_id(
            obj=self.obj,
            pk=self.obj.customer.id,
            object_pk=self.obj.id,
        )

    def test_object_from_another_customer_returns_404(self) -> None:
        """Test the logic for retrieving a construction object from another customer."""

        self._logger_header("ENDPOINT GET: retrieve object from another customer")
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
