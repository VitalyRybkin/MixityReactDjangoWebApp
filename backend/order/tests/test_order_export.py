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

        self.url = reverse(f"order_orders:{OrderRoutes.EXPORT.name}")

    def test_without_export_permission_returns_403(self) -> None:
        """
        Tests that without the export permission, a GET request to the download
        orders endpoint returns a 403 Forbidden status.
        """
        self._logger_header("ORDER EXPORT: WITHOUT EXPORT PERMISSION RETURNS 403")
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

        self._logger_success("Access denied without order.export_order", "HTTP 403")

    def test_with_export_permission_returns_200(self) -> None:
        """
        Tests that with the export permission, a GET request to the download
        orders endpoint returns a 200 OK status.
        """
        self._logger_header("ORDER EXPORT: WITH EXPORT PERMISSION RETURNS 200")
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

        self._logger_success("Access granted with order.export_order", "HTTP 200")

    def test_view_order_permission_is_not_enough_for_export(self) -> None:
        """
        Tests that the view_order permission is not enough for exporting orders.
        """
        self._logger_header(
            "ORDER EXPORT: " "VIEW ORDER PERMISSION IS NOT ENOUGH FOR EXPORT"
        )
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

        self._logger_success("order.view_order is not enough for export", "HTTP 403")
