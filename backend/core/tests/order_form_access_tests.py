from typing import Any, cast

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from rest_framework import status
from rest_framework.test import APIClient


class OrderFormAccessContractMixin:
    def _request_with_permission(
        self,
        permission: str,
        username: str,
    ) -> Any:
        user = get_user_model().objects.create_user(
            username=username,
            password="test_password",
        )

        app_label, codename = permission.split(".", maxsplit=1)

        django_permission = Permission.objects.get(
            content_type__app_label=app_label,
            codename=codename,
        )
        user.user_permissions.add(django_permission)

        client = cast(APIClient, getattr(self, "client"))
        client.force_authenticate(user=user)

        url = cast(str, getattr(self, "url"))

        return client.get(url)

    def _with_add_order_permission_logic(self) -> None:
        response = self._request_with_permission(
            "order.add_order",
            f"{self.__class__.__name__}_add_order",
        )

        assert response.status_code == status.HTTP_200_OK, response.data

        color = getattr(self, "COLOR", {"OK": "", "END": ""})

        print(
            f"    {color['OK']}"
            "✓ Access granted with order.add_order | HTTP 200"
            f"{color['END']}"
        )

    def _with_change_order_permission_logic(self) -> None:
        response = self._request_with_permission(
            "order.change_order",
            f"{self.__class__.__name__}_change_order",
        )

        assert response.status_code == status.HTTP_200_OK, response.data

        color = getattr(self, "COLOR", {"OK": "", "END": ""})

        print(
            f"    {color['OK']}"
            "✓ Access granted with order.change_order | HTTP 200"
            f"{color['END']}"
        )

    def _with_only_view_order_permission_logic(self) -> None:
        response = self._request_with_permission(
            "order.view_order",
            f"{self.__class__.__name__}_view_order",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN, response.data

        color = getattr(self, "COLOR", {"OK": "", "END": ""})

        print(
            f"    {color['OK']}"
            "✓ order.view_order is not enough | HTTP 403"
            f"{color['END']}"
        )
