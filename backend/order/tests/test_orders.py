from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from io import BytesIO
from tempfile import TemporaryDirectory
from typing import Any, ClassVar
from unittest import SkipTest
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission, User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from pypdf import PdfWriter
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.tests.api.factories import ProductFactory
from contacts.factories import ContactFactory
from core.security.clamav import (
    ClamAVUnavailableError,
    MalwareDetectedError,
)
from core.tests.authentication_tests import AuthenticationContractMixin
from core.tests.base_test_case import BaseAPIMixin
from core.tests.base_view_test_case import BaseViewTestCase
from core.tests.model_tests import ModelContractMixin
from core.tests.utils import TestLoggerMixin
from order.models import Order, OrderItem, PackType
from order.routes import OrderRoutes
from order.serializers.order_serializers.create_order_serializers import (
    OrderReadSerializer,
    OrderWriteSerializer,
)
from order.tests.factories import (
    ClientFactory,
    CustomerFactory,
    OrderDeliveryDataFactory,
    OrderFactory,
    OrderItemFactory,
    PackTypeFactory,
)
from order.views.orders import OrderListCreateAPIView, OrderRetrieveUpdateDestroyAPIView
from stock.tests.factories import WarehouseFactory


def make_test_pdf() -> SimpleUploadedFile:
    buffer = BytesIO()

    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.write(buffer)

    return SimpleUploadedFile(
        name="upd.pdf",
        content=buffer.getvalue(),
        content_type="application/pdf",
    )


class TestOrderUpdUploadAPIView(APITestCase, TestLoggerMixin):
    authentication_method = "patch"

    def setUp(self) -> None:
        super().setUp()

        user_model = get_user_model()

        self.user = user_model.objects.create_superuser(
            username="test_upd_admin",
            email="test_upd_admin@example.com",
            password="test_password",
        )

        self.client.force_authenticate(user=self.user)

        self.order = OrderFactory.create()

        self.url = reverse(
            f"order_orders:{OrderRoutes.UPLOAD_UPD.name}",
            kwargs={"pk": self.order.pk},
        )

        self.temp_media = TemporaryDirectory()
        self.override_media = override_settings(
            MEDIA_ROOT=self.temp_media.name,
        )
        self.override_media.enable()

    def tearDown(self) -> None:
        self.override_media.disable()
        self.temp_media.cleanup()

        super().tearDown()

    def test_upload_valid_pdf(self) -> None:
        file = make_test_pdf()

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

        self.order.refresh_from_db()

        self.assertTrue(self.order.upd_pdf)
        self.assertTrue(self.order.upd_pdf.name.endswith(".pdf"))
        self.assertTrue(self.order.upd_pdf.storage.exists(self.order.upd_pdf.name))

    def test_upload_fake_pdf_returns_400(self) -> None:
        file = SimpleUploadedFile(
            name="fake.pdf",
            content=b"This is definitely not a PDF",
            content_type="application/pdf",
        )

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )

        self.assertIn("errors", response.data)
        self.assertIn("upd_pdf", response.data["errors"])

        self.order.refresh_from_db()
        self.assertFalse(self.order.upd_pdf)

    def test_delete_upd_pdf(self) -> None:
        file = make_test_pdf()

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

        self.order.refresh_from_db()

        old_file_name = self.order.upd_pdf.name
        storage = self.order.upd_pdf.storage

        self.assertTrue(storage.exists(old_file_name))

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                self.url,
                {"upd_pdf": None},
                format="json",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)
        self.assertFalse(storage.exists(old_file_name))

    def test_replace_upd_pdf_deletes_old_file(self) -> None:
        old_file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": old_file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        old_file_name = self.order.upd_pdf.name
        storage = self.order.upd_pdf.storage

        self.assertTrue(storage.exists(old_file_name))

        new_file = make_test_pdf()
        new_file.name = "new_upd.pdf"

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                self.url,
                {"upd_pdf": new_file},
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        new_file_name = self.order.upd_pdf.name

        self.assertNotEqual(old_file_name, new_file_name)
        self.assertFalse(storage.exists(old_file_name))
        self.assertTrue(storage.exists(new_file_name))

    @patch("order.validators.upd_pdf.scan_file_for_malware")
    def test_upload_pdf_with_malware_returns_400(
        self,
        mock_scan: MagicMock,
    ) -> None:
        mock_scan.side_effect = MalwareDetectedError("Eicar-Test-Signature FOUND")

        file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )

        self.assertIn("errors", response.data)
        self.assertIn("upd_pdf", response.data["errors"])

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)

        mock_scan.assert_called_once()

    @patch("order.validators.upd_pdf.scan_file_for_malware")
    def test_upload_pdf_when_clamav_unavailable_returns_503(
        self,
        mock_scan: MagicMock,
    ) -> None:

        self._logger_header("TEST UPLOAD PDF when ClamAV unavailable returns 503")
        mock_scan.side_effect = ClamAVUnavailableError("ClamAV недоступен.")

        file = make_test_pdf()

        with (
            self.assertLogs("core.api.exceptions", level="ERROR"),
            self.assertLogs("django.request", level="ERROR"),
        ):
            response = self.client.patch(
                self.url,
                {"upd_pdf": file},
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)

        mock_scan.assert_called_once()

        print(
            f"    {self.COLOR['OK']}✓ Antivirus unavailable handled correctly | HTTP 503{self.COLOR['END']}"
        )

    def test_get_is_not_allowed(self) -> None:
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_delete_is_not_allowed(self) -> None:
        response = self.client.delete(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_put_is_not_allowed(self) -> None:
        response = self.client.put(
            self.url,
            {},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_upload_without_change_order_permission_returns_403(self) -> None:
        user_model = get_user_model()

        user = user_model.objects.create_user(
            username="test_upd_no_permission",
            password="test_password",
        )

        self.client.force_authenticate(user=user)

        file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)

    def test_upload_with_change_order_permission_returns_200(self) -> None:
        user_model = get_user_model()

        user = user_model.objects.create_user(
            username="test_upd_change_permission",
            password="test_password",
        )

        permission = Permission.objects.get(
            content_type__app_label="order",
            codename="change_order",
        )
        user.user_permissions.add(permission)

        self.client.force_authenticate(user=user)

        file = make_test_pdf()

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

        self.order.refresh_from_db()

        self.assertTrue(self.order.upd_pdf)


class TestOrderAPIList(BaseAPIMixin):
    __test__ = True
    url_name = f"order_orders:{OrderRoutes.LIST_CREATE.name}"
    factory = OrderFactory
    model = Order

    def test_create_order_no_data(self) -> None:
        """Test creating an order with no data."""
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


class BaseOrderSerializersTestCase(BaseViewTestCase):
    """
    Test case for view serializer classes.

    Attributes:
        _view_class: The view class being tested.
        _cases: A list of test cases, each consisting of a method and its
            expected serializer.

    Methods:
        test_serializer_classes:
            Tests the serializer class for each method and its corresponding
            expected serializer.
    """

    __test__ = False
    _cases = []

    def test_serializer_classes(self) -> None:
        for method, serializer in self._cases:
            with self.subTest(method=method):
                self._assert_serializer_class(
                    method=method,
                    expected_serializer=serializer,
                )


class TestOrderRetrieveUpdateDestroySerializers(
    BaseOrderSerializersTestCase, BaseViewTestCase
):
    """
    Test case for verifying the behavior of the
    OrderRetrieveUpdateDestroyAPIView with various HTTP methods.
    """

    __test__ = True
    _view_class = OrderRetrieveUpdateDestroyAPIView
    _cases = [
        ("GET", OrderReadSerializer),
        ("PUT", OrderWriteSerializer),
        ("PATCH", OrderWriteSerializer),
        ("DELETE", OrderWriteSerializer),
    ]


class TestOrderListCreateSerializers(BaseOrderSerializersTestCase, BaseViewTestCase):
    """Test class for verifying OrderListCreateAPIView behavior."""

    __test__ = True
    _view_class = OrderListCreateAPIView
    _cases = [
        ("GET", OrderReadSerializer),
        ("POST", OrderWriteSerializer),
    ]


@dataclass(frozen=True, slots=True)
class FilterCase:
    expected_count: int
    params: dict


class TestOrderFilteredAPIListCreate(BaseAPIMixin):
    """
    TestOrderFilteredAPIListCreate performs tests for listing and creating orders
    with filtering functionality.

    Args:
        url_name: The name of the API endpoint route for fetching order resources.
        factory: The factory class used to create order objects.
    """

    __test__ = True

    url_name = f"order_orders:{OrderRoutes.LIST_CREATE.name}"
    factory = OrderFactory

    permission_model = Order

    def test_filter_by_params(self) -> None:
        Order.objects.all().delete()

        num_of_days = 5
        customers = [
            CustomerFactory.create(),
            CustomerFactory.create(),
        ]

        for day_offset in range(num_of_days):
            for customer in customers:
                self.factory.create(
                    delivery_date=date.today() + timedelta(days=day_offset),
                    customer=customer,
                )

        filter_cases = [
            FilterCase(
                expected_count=10,
                params={},
            ),
            FilterCase(
                expected_count=10,
                params={
                    "date_from": date.today(),
                },
            ),
            FilterCase(
                expected_count=10,
                params={
                    "date_to": date.today() + timedelta(days=num_of_days - 1),
                },
            ),
            FilterCase(
                expected_count=4,
                params={
                    "date_from": date.today(),
                    "date_to": date.today() + timedelta(days=1),
                },
            ),
            FilterCase(
                expected_count=5,
                params={
                    "status": Order.Status.DRAFT,
                },
            ),
            FilterCase(
                expected_count=5,
                params={
                    "customer_id": customers[1].id,
                },
            ),
        ]

        for case in filter_cases:
            with self.subTest(params=case.params):
                self._assert_filtered_count(
                    expected_count=case.expected_count,
                    params=case.params,
                )


class TestOrderResourcesAPIView(
    APITestCase,
    AuthenticationContractMixin,
    TestLoggerMixin,
):
    """
    Test suite for validating the behavior of the order resources API endpoint.

    Args:
        url_name: The name of the API endpoint route for fetching order resources.
        AMOUNT_OF_RESOURCES: The number of resources created for test setup and
            validation purposes.
    """

    url_name = f"order_orders:{OrderRoutes.RESOURCES.name}"
    AMOUNT_OF_RESOURCES: ClassVar[int] = 3

    def setUp(self) -> None:
        super().setUp()

        self.url = reverse(self.url_name)

        user_model = get_user_model()

        self.user = user_model.objects.create_superuser(
            username="test_order_resources_admin",
            email="test_order_resources_admin@example.com",
            password="test_password",
        )

        self.client.force_authenticate(user=self.user)

    def test_order_resources(self) -> None:
        """Test the order resources API endpoint."""
        ClientFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        CustomerFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        ProductFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        WarehouseFactory.create_batch(self.AMOUNT_OF_RESOURCES)
        PackTypeFactory.create_batch(self.AMOUNT_OF_RESOURCES)

        url = reverse(self.url_name)

        self._logger_header(f"ENDPOINT GET: {url}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_resources = {
            "clients": self.AMOUNT_OF_RESOURCES,
            "customers": self.AMOUNT_OF_RESOURCES,
            "products": self.AMOUNT_OF_RESOURCES,
            "warehouses": self.AMOUNT_OF_RESOURCES,
            "pack_types": self.AMOUNT_OF_RESOURCES,
        }

        for resource_name, expected_count in expected_resources.items():
            with self.subTest(resource=resource_name):
                self.assertIn(resource_name, response.data)
                self.assertEqual(len(response.data[resource_name]), expected_count)

                for item in response.data[resource_name]:
                    self.assertIn("id", item)

                print(
                    f"    {self.COLOR['OK']}✓ "
                    f"{resource_name} and id's are available in response, expected amount received."
                    f"{self.COLOR['END']}"
                )

    def test_order_resources_returns_only_active_items(self) -> None:
        """Test the order resources API endpoint returns only active items."""
        ClientFactory.create_batch(self.AMOUNT_OF_RESOURCES, is_active=True)
        ClientFactory.create_batch(2, is_active=False)

        url = reverse(self.url_name)
        self._logger_header(f"ENDPOINT GET (CHECK ACTIVE ONLY): {url}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["clients"]), self.AMOUNT_OF_RESOURCES)

        print(
            f"    {self.COLOR['OK']}✓ "
            f"Only active clients are returned in response."
            f"{self.COLOR['END']}"
        )

    def test_with_add_order_permission_returns_200(self) -> None:
        user = get_user_model().objects.create_user(
            username="resources_add_order",
            password="test_password",
        )

        permission = Permission.objects.get(
            content_type__app_label="order",
            codename="add_order",
        )
        user.user_permissions.add(permission)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        print(
            f"    {self.COLOR['OK']}"
            "✓ Access granted with order.add_order | HTTP 200"
            f"{self.COLOR['END']}"
        )

    def test_with_change_order_permission_returns_200(self) -> None:
        user = get_user_model().objects.create_user(
            username="resources_change_order",
            password="test_password",
        )

        permission = Permission.objects.get(
            content_type__app_label="order",
            codename="change_order",
        )
        user.user_permissions.add(permission)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        print(
            f"    {self.COLOR['OK']}"
            "✓ Access granted with order.change_order | HTTP 200"
            f"{self.COLOR['END']}"
        )

    def test_with_only_view_order_permission_returns_403(self) -> None:
        user = get_user_model().objects.create_user(
            username="resources_view_only",
            password="test_password",
        )

        permission = Permission.objects.get(
            content_type__app_label="order",
            codename="view_order",
        )
        user.user_permissions.add(permission)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            response.data,
        )

        print(
            f"    {self.COLOR['OK']}"
            "✓ order.view_order is not enough for resources | HTTP 403"
            f"{self.COLOR['END']}"
        )


@pytest.mark.django_db
class TestPackType(APITestCase, ModelContractMixin, TestLoggerMixin):
    """Test suite for validating the behavior of the pack type model."""

    factory = PackTypeFactory
    model = PackType

    def setUp(self) -> None:
        if self.factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No resource found for testing.")

        self.obj = self.factory.create()

    def test_pack_type_str_method(self) -> None:
        """Test the pack type model's __str__ method."""
        pack_type = self.obj
        self._str_method_logic(pack_type.name)


@pytest.mark.django_db
class TestOrderItem(APITestCase, ModelContractMixin, TestLoggerMixin):
    """Test suite for validating the behavior of the order item model."""

    factory = OrderItemFactory
    model = OrderItem

    def setUp(self) -> None:
        if self.factory is None:
            raise SkipTest(f"{self.__class__.__name__}: No resource found for testing.")

        self.obj = self.factory.create()

    def test_pack_type_str_method(self) -> None:
        """Test str method for OrderItem model."""
        order_item = self.obj
        self._str_method_logic(
            f"Order {order_item.order.id} - Product {order_item.product.name}"
        )

    def test_get_total_price_for_weight_based_product(self) -> None:
        """Test the get_total_price method for a weight-based product."""
        self.obj = self.factory.create(
            piece_based_quantity=None,
            weight_quantity=Decimal("2.50"),
            price_at_purchase=Decimal("10.00"),
        )
        self._get_total_logic(Decimal("25.00"))

    def test_get_total_price_for_piece_based_product(self) -> None:
        """Test the get_total_price method for a piece-based product."""
        self.obj = self.factory.create(
            piece_based_quantity=5,
            weight_quantity=None,
            price_at_purchase=Decimal("10.00"),
        )
        self._get_total_logic(Decimal("50.00"))

    def test_get_total_price_when_no_purchase_price(self) -> None:
        """Test the get_total_price method when no purchase price is set."""
        self.obj = self.factory.create(
            piece_based_quantity=5, weight_quantity=None, price_at_purchase=None
        )
        self._get_total_logic(Decimal("0.00"))


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


class TestOrdersDownloadPermissions(
    APITestCase,
    AuthenticationContractMixin,
    TestLoggerMixin,
):
    __test__ = True

    def setUp(self) -> None:
        super().setUp()

        self.url = reverse(f"order_orders:{OrderRoutes.DOWNLOAD.name}")

    def test_without_export_permission_returns_403(self) -> None:
        user = get_user_model().objects.create_user(
            username="export_no_permission",
            password="test_password",
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        print(
            f"    {self.COLOR['OK']}"
            "✓ Access denied without order.export_order | HTTP 403"
            f"{self.COLOR['END']}"
        )

    def test_with_export_permission_returns_200(self) -> None:
        user = get_user_model().objects.create_user(
            username="export_with_permission",
            password="test_password",
        )

        permission = Permission.objects.get(
            content_type__app_label="order",
            codename="export_order",
        )
        user.user_permissions.add(permission)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        print(
            f"    {self.COLOR['OK']}"
            "✓ Access granted with order.export_order | HTTP 200"
            f"{self.COLOR['END']}"
        )

    def test_view_order_permission_is_not_enough_for_export(self) -> None:
        user = get_user_model().objects.create_user(
            username="export_view_only",
            password="test_password",
        )

        permission = Permission.objects.get(
            content_type__app_label="order",
            codename="view_order",
        )
        user.user_permissions.add(permission)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        print(
            f"    {self.COLOR['OK']}"
            "✓ order.view_order is not enough for export | HTTP 403"
            f"{self.COLOR['END']}"
        )
