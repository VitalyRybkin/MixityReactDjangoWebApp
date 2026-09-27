from datetime import date
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from catalog.tests.api.factories import ProductFactory
from contacts.factories import ContactFactory
from core.tests.base_test_case import BaseAPIMixin
from logistic.tests.factories import CarrierFactory, DriverFactory, TruckFactory
from order.models import Order
from order.routes import OrderRoutes
from order.tests.factories import (
    ClientFactory,
    ConstructionObjectFactory,
    CustomerFactory,
    OrderDeliveryDataFactory,
    OrderFactory,
    OrderItemFactory,
)
from stock.tests.factories import WarehouseFactory


class TestOrderAPIList(BaseAPIMixin):
    """
    TestOrderAPIList class for testing the API list and creation endpoints for orders.
    """

    __test__ = True
    url_name = f"order_orders:{OrderRoutes.LIST_CREATE.name}"
    factory = OrderFactory
    model = Order

    def test_create_order_with_minimal_payload(self) -> None:
        """Test creating an order with minimal payload."""
        self._create_logic(self.payload_generator()[0])

    def test_create_order(self) -> None:
        """Test creating an order with valid data."""

        payload, temp_order = self.payload_generator()
        delivery_data = OrderDeliveryDataFactory.create(order=temp_order)
        delivery = {
            "order": delivery_data.order.id,
            "delivery_cost": "1000.00",
        }
        payload["delivery"] = delivery

        products = OrderItemFactory.create_batch(3, order=temp_order)
        payload["products"] = [
            {
                "product": item.product.id,
                "quantity": str(item.weight_quantity),
                "package": item.pack_type.id,
                "price_at_sale": item.price_at_sale,
                "price_at_purchase": str(item.price_at_purchase),
            }
            for item in products
        ]

        self._create_logic(payload)

    def test_create_order_invalid_quantity(self) -> None:
        """Test creating an order with invalid quantity data."""
        self.client.force_authenticate(
            user=User.objects.create_superuser(username="testuser", password="")
        )

        payload, temp_order = self.payload_generator()
        delivery_data = OrderDeliveryDataFactory.create(order=temp_order)
        delivery = {"order": delivery_data.order.id}
        payload["delivery"] = delivery

        item = OrderItemFactory.create(order=temp_order)
        payload["products"] = [
            {
                "product": item.product.id,
                "quantity": "2.5",
                "package": item.pack_type.id,
                "price_at_sale": item.price_at_sale,
                "price_at_purchase": str(item.price_at_purchase),
            }
        ]
        self._create_logic(
            payload,
            expected_error="Products: Для штучного товара количество должно быть целым числом.",
        )

    def test_create_piece_based_and_weight_quantity(self) -> None:
        """Test creating an order with both piece-based and weight-based quantities."""
        self.client.force_authenticate(
            user=User.objects.create_superuser(username="testuser", password="")
        )

        payload, temp_order = self.payload_generator()
        delivery_data = OrderDeliveryDataFactory.create(order=temp_order)
        delivery = {"order": delivery_data.order.id}
        payload["delivery"] = delivery

        product_1 = OrderItemFactory.create(order=temp_order)
        product_2 = OrderItemFactory.create(
            order=temp_order,
            weight_quantity=None,
            piece_based_quantity=5,
            product=ProductFactory.create(is_piece_based=False),
        )

        payload["products"] = [
            {
                "product": product_1.product.id,
                "quantity": str(product_1.weight_quantity),
                "package": product_1.pack_type.id,
                "price_at_sale": product_1.price_at_sale,
                "price_at_purchase": str(product_1.price_at_purchase),
            },
            {
                "product": product_2.product.id,
                "quantity": str(product_2.piece_based_quantity),
                "package": product_2.pack_type.id,
                "price_at_sale": product_2.price_at_sale,
                "price_at_purchase": str(product_2.price_at_purchase),
            },
        ]
        self._create_logic(payload)

    def test_create_with_inactive_customer_object_returns_400(self) -> None:
        payload, temp = self.payload_generator()

        self._assert_create_with_inactive_related_returns_400(
            payload=payload,
            field_name="customer_object",
            related_factory=ConstructionObjectFactory,
            related_factory_kwargs={
                "customer": temp.customer,
            },
        )

    def test_create_with_customer_object_from_another_customer_returns_400(
        self,
    ) -> None:
        payload, _ = self.payload_generator()

        another_customer = CustomerFactory.create()
        customer_object = ConstructionObjectFactory.create(
            customer=another_customer,
            is_active=True,
        )

        payload["customer_object"] = customer_object.pk

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

    def test_create_with_invalid_contact_returns_400(self) -> None:
        """Tests that creating an order with an invalid contact returns a 400 status code."""
        cases = [
            ContactFactory.create(client=ClientFactory.create(), carrier=None),
            ContactFactory.create(customer=CustomerFactory.create(), carrier=None),
            ContactFactory.create(carrier=CarrierFactory.create()),
            ContactFactory.create(warehouse=WarehouseFactory.create(), carrier=None),
        ]

        for contact in cases:
            with self.subTest(contact=contact.pk):
                payload, _ = self.payload_generator()
                payload["contacts"] = [contact.pk]

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

    def test_create_with_customer_contact_returns_201(self) -> None:
        """Tests that creating an order with a customer contact returns a 201 status code."""
        payload, temp = self.payload_generator()

        contact = ContactFactory.create(
            customer=temp.customer,
            carrier=None,
        )

        payload["contacts"] = [contact.pk]

        response = self.client.post(
            self.url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

    def test_create_with_delivery_from_another_carrier_returns_400(self) -> None:
        """Tests that creating an order with a delivery from another carrier returns a 400 status code."""
        carrier = CarrierFactory.create()
        another_carrier = CarrierFactory.create()

        cases = [
            (
                "driver",
                DriverFactory.create(carrier=another_carrier),
            ),
            (
                "truck",
                TruckFactory.create(carrier=another_carrier),
            ),
        ]

        for field_name, obj in cases:
            with self.subTest(field=field_name):
                payload, _ = self.payload_generator()

                payload["delivery"] = {
                    "carrier": carrier.pk,
                    field_name: obj.pk,
                }

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

    def test_create_with_valid_delivery_returns_201(self) -> None:
        """Tests that creating an order with a valid delivery returns a 201 status code."""
        payload, _ = self.payload_generator()

        carrier = CarrierFactory.create()
        driver = DriverFactory.create(carrier=carrier)
        truck = TruckFactory.create(carrier=carrier)

        payload["delivery"] = {
            "carrier": carrier.pk,
            "driver": driver.pk,
            "truck": truck.pk,
        }

        response = self.client.post(
            self.url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

    def test_create_with_inactive_delivery_carrier_returns_400(self) -> None:
        """Tests that creating an order with an inactive delivery carrier returns a 400 status code."""
        payload, _ = self.payload_generator()

        carrier = CarrierFactory.create(is_active=False)

        payload["delivery"] = {
            "carrier": carrier.pk,
        }

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

    def test_create_with_order_date(self) -> None:
        self._logger_header("CREATE ORDER WITH CUSTOM ORDER DATE")

        payload, _ = self.payload_generator()
        payload["order_date"] = "2026-09-20"

        response = self.client.post(
            self.url,
            data=payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        order = Order.objects.get(pk=response.data["id"])

        self.assertEqual(
            order.order_date,
            date(2026, 9, 20),
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Order created with custom order date | 2026-09-20"
            f"{self.COLOR['END']}"
        )

    def payload_generator(self) -> tuple[dict[str, list[Any] | Any], Any]:
        """Generates a payload for order creation tests."""
        temp = self.factory.create()
        contacts = ContactFactory.create_batch(3, client=temp.client, carrier=None)

        return (
            {
                "client": temp.client.id,
                "customer": temp.customer.id,
                "warehouse": temp.warehouse.id,
                "delivery_date": temp.delivery_date,
                "status": temp.status,
                "contacts": [contact.id for contact in contacts],
            },
            temp,
        )


class TestOrderRetrieveUpdateDestroy(BaseAPIMixin):
    """Test suite for validating the behavior of the OrderRetrieveUpdateDestroy API view."""

    __test__ = True
    model = Order
    factory = OrderFactory

    pk_url_name = f"order_orders:{OrderRoutes.DETAIL.name}"

    def test_retrieve_update_logic(self) -> None:
        self._retrieve_object_by_id()

    def test_not_found_error(self) -> None:
        self._retrieve_object_by_id_not_found()

    def test_patch_logic(self) -> None:
        payload = {
            "status": Order.Status.CREATED,
            "contacts": [],
            "products": [],
        }
        self._patch_logic_success(payload)

    def test_delete_logic(self) -> None:
        initial_count = Order.objects.count()
        self._delete_logic(expected_status=status.HTTP_204_NO_CONTENT)
        self.assertEqual(Order.objects.count(), initial_count)

    def test_patch_customer_rejects_existing_object_from_old_customer(self) -> None:
        """
        Test that updating the customer field through the order endpoint rejects existing
        construction object from the old customer.
        """
        customer_object = ConstructionObjectFactory.create(
            customer=self.obj.customer,
        )
        self.obj.customer_object = customer_object
        self.obj.save(update_fields=["customer_object"])

        new_customer = CustomerFactory.create()

        response = self.client.patch(
            self.url,
            {"customer": new_customer.pk},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )

    def test_patch_client_rejects_existing_contact_from_old_client(self) -> None:
        """
        Test that updating the client field through the order endpoint rejects existing contact from the old client.
        """
        contact = ContactFactory.create(
            client=self.obj.client,
            carrier=None,
        )
        self.obj.contacts.set([contact])

        new_client = ClientFactory.create()

        response = self.client.patch(
            self.url,
            {"client": new_client.pk},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )

    def test_patch_carrier_rejects_existing_driver_and_truck_from_old_carrier(
        self,
    ) -> None:
        """
        Test that updating the carrier field through the order endpoint rejects
        existing driver and truck from the old carrier.
        """
        carrier = CarrierFactory.create()
        driver = DriverFactory.create(carrier=carrier)
        truck = TruckFactory.create(carrier=carrier)

        OrderDeliveryDataFactory.create(
            order=self.obj,
            carrier=carrier,
            driver=driver,
            truck=truck,
        )

        new_carrier = CarrierFactory.create()

        response = self.client.patch(
            self.url,
            {
                "delivery": {
                    "carrier": new_carrier.pk,
                }
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )

    def test_patch_cannot_change_order_user(self) -> None:
        """
        Test that updating the user field through the order endpoint is not allowed.
        """
        original_user = get_user_model().objects.create_user(
            username="original_order_user",
            password="test_password",
        )
        another_user = get_user_model().objects.create_user(
            username="another_order_user",
            password="test_password",
        )

        self.obj.user = original_user
        self.obj.save(update_fields=["user"])

        response = self.client.patch(
            self.url,
            {"user": another_user.pk},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.obj.refresh_from_db()

        self.assertEqual(
            self.obj.user_id,
            original_user.pk,
        )

    def test_patch_cannot_upload_upd_pdf_through_order_endpoint(self) -> None:
        """
        Test that updating the upd_pdf field through the order endpoint is not allowed.
        """
        file = SimpleUploadedFile(
            "test.pdf",
            b"%PDF-1.4 fake content",
            content_type="application/pdf",
        )

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.obj.refresh_from_db()

        self.assertFalse(self.obj.upd_pdf)

    def test_patch_order_date(self) -> None:
        """
        Test patching order date.
        """
        self._logger_header("PATCH ORDER DATE")

        response = self.client.patch(
            self.url,
            {"order_date": "2026-09-15"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.obj.refresh_from_db()

        self.assertEqual(
            self.obj.order_date,
            date(2026, 9, 15),
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Order date updated successfully | 2026-09-15"
            f"{self.COLOR['END']}"
        )
