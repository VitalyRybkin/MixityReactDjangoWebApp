from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.tests.authentication_tests import AuthenticationContractMixin
from core.tests.utils import TestLoggerMixin
from order.routes import OrderRoutes


class TestOrdersDownloadPermissions(
    APITestCase,
    AuthenticationContractMixin,
    TestLoggerMixin,
):
    """
    Tests the permissions for downloading orders.
    """

    __test__ = True

    def setUp(self) -> None:
        super().setUp()

        self.url = reverse(f"order_orders:{OrderRoutes.DOWNLOAD.name}")

    def test_without_export_permission_returns_403(self) -> None:
        """
        Tests that without the export permission, a GET request to the download
        orders endpoint returns a 403 Forbidden status.
        """
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
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Access denied without order.export_order | HTTP 403"
            f"{self.COLOR['END']}"
        )

    def test_with_export_permission_returns_200(self) -> None:
        """
        Tests that with the export permission, a GET request to the download
        orders endpoint returns a 200 OK status.
        """
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
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Access granted with order.export_order | HTTP 200"
            f"{self.COLOR['END']}"
        )

    def test_view_order_permission_is_not_enough_for_export(self) -> None:
        """
        Tests that the view_order permission is not enough for exporting orders.
        """
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
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ order.view_order is not enough for export | HTTP 403"
            f"{self.COLOR['END']}"
        )
