from io import StringIO
from typing import Any, ClassVar

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.db.models import Model
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase

from core.tests.utils import TestLoggerMixin


class BasePermissionMatrixTestCase(TestLoggerMixin, APITestCase):
    __test__ = False

    app_label: ClassVar[str] = ""
    role_matrix: ClassVar[dict[str, dict[str, bool]]] = {}
    permission_codenames: ClassVar[dict[str, str]] = {}
    permission_models: ClassVar[tuple[type[Model], ...]] = ()

    api_actions: ClassVar[tuple[str, ...]] = (
        "view",
        "add",
        "change",
        "delete",
    )

    http_methods: ClassVar[dict[str, str]] = {
        "view": "GET",
        "add": "POST",
        "change": "PATCH",
        "delete": "DELETE",
    }

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        call_command(
            "sync_group_permissions",
            stdout=StringIO(),
        )

    def create_user_for_role(self, role: str) -> Any:
        user_model = get_user_model()

        user = user_model.objects.create_user(
            username=role.lower().replace(" ", "_"),
            password="test_password",
        )

        group = Group.objects.get(name=role)
        user.groups.add(group)

        return user

    def create_object(self) -> Any:
        raise NotImplementedError

    def get_create_url(self) -> str:
        raise NotImplementedError

    def get_detail_url(self, obj: Any) -> str:
        raise NotImplementedError

    def get_create_payload(self) -> dict[str, Any]:
        raise NotImplementedError

    def get_update_payload(self) -> dict[str, Any]:
        raise NotImplementedError

    def request_action(self, action: str) -> Response:
        if action == "add":
            return self.client.post(
                self.get_create_url(),
                self.get_create_payload(),
                format="json",
            )

        obj = self.create_object()
        url = self.get_detail_url(obj)

        if action == "view":
            return self.client.get(url)

        if action == "change":
            return self.client.patch(
                url,
                self.get_update_payload(),
                format="json",
            )

        if action == "delete":
            return self.client.delete(url)

        raise ValueError(f"Unsupported action: {action}")

    def expected_status(
        self,
        action: str,
        allowed: bool,
    ) -> int:
        if not allowed:
            return status.HTTP_403_FORBIDDEN

        return {
            "view": status.HTTP_200_OK,
            "add": status.HTTP_201_CREATED,
            "change": status.HTTP_200_OK,
            "delete": status.HTTP_204_NO_CONTENT,
        }[action]

    def test_group_permission_matrix(self) -> None:
        self._logger_header(f"{self.app_label.upper()} GROUP PERMISSION MATRIX")

        for role, permissions in self.role_matrix.items():
            user = self.create_user_for_role(role)

            for action, expected in permissions.items():
                models = self.permission_models or (None,)

                for model in models:
                    if model is not None:
                        app_label = model._meta.app_label
                        codename = f"{action}_{model._meta.model_name}"
                    else:
                        app_label = self.app_label
                        codename = self.permission_codenames[action]

                    permission = f"{app_label}.{codename}"

                    with self.subTest(
                        role=role,
                        model=model.__name__ if model else None,
                        action=action,
                    ):
                        actual = user.has_perm(permission)

                        self.assertEqual(
                            actual,
                            expected,
                            (
                                f"{role}: {permission} "
                                f"expected={expected}, actual={actual}"
                            ),
                        )

                        self._logger_success(
                            role,
                            f"{permission:<35} | "
                            f"{'ALLOWED' if actual else 'FORBIDDEN'}",
                        )

    def test_api_permission_matrix(self) -> None:
        self._logger_header(f"{self.app_label.upper()} API PERMISSION MATRIX")

        for role, permissions in self.role_matrix.items():
            user = self.create_user_for_role(role)

            self.client.force_authenticate(user=user)

            try:
                for action in self.api_actions:
                    with self.subTest(role=role, action=action):
                        response = self.request_action(action)
                        allowed = permissions[action]

                        self.assertEqual(
                            response.status_code,
                            self.expected_status(action, allowed),
                            getattr(response, "data", None),
                        )

                        self._logger_success(
                            role,
                            f"{self.http_methods[action]:<6} | "
                            f"{response.status_code:<3} | "
                            f"{'ALLOWED' if allowed else 'FORBIDDEN'}",
                        )
            finally:
                self.client.force_authenticate(user=None)
