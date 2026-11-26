from typing import TYPE_CHECKING, Any, ClassVar
from unittest import SkipTest

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db.models import Model
from rest_framework import status

User = get_user_model()

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


class PermissionContractMixin(_Base):
    permission_model: ClassVar[type[Model] | None] = None
    view_permissions: ClassVar[list[str] | None] = None
    check_get_permissions: ClassVar[bool] = True

    def get_permission_test_params(self) -> dict:
        return {}

    def _get_view_permissions(self) -> list[str]:
        if self.view_permissions is not None:
            return self.view_permissions

        model = self.permission_model or getattr(self, "model", None)

        if model is None:
            raise SkipTest("Permission model is not configured for this endpoint")

        return [f"{model._meta.app_label}.view_{model._meta.model_name}"]

    def _add_permissions(
        self,
        user: Any,
        permissions: list[str],
    ) -> None:
        for permission_name in permissions:
            app_label, codename = permission_name.split(".", 1)

            permission = Permission.objects.get(
                content_type__app_label=app_label,
                codename=codename,
            )

            user.user_permissions.add(permission)

    def test_get_without_view_permission_returns_403(self) -> None:

        if not self.check_get_permissions:
            pytest.skip("GET permission check not applicable: GET disabled")

        self._logger_header(f"ENDPOINT GET: {self.url} without view permission")
        user = User.objects.create_user(
            username="permission_without_view",
            password="test_password",
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            data=self.get_permission_test_params(),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self._logger_success("Access denied without view permission", "HTTP 403")

    def test_get_with_view_permission_returns_200(self) -> None:

        if not self.check_get_permissions:
            pytest.skip("GET permission check not applicable: GET disabled")

        self._logger_header(f"ENDPOINT GET: {self.url} with view permission")
        user = User.objects.create_user(
            username="permission_with_view",
            password="test_password",
        )

        self._add_permissions(
            user,
            self._get_view_permissions(),
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            data=self.get_permission_test_params(),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self._logger_success("Access granted with view permission", "HTTP 200")
