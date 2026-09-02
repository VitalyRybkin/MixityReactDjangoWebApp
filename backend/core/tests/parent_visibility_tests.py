from typing import Any, cast

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.tests.utils import TestLoggerMixin


class ParentVisibilityContractMixin:
    def _get_parent(self) -> Any:
        return getattr(self, "obj")

    def _get_parent_url_kwargs(self, parent_pk: int) -> dict[str, Any]:
        return {"pk": parent_pk}

    def _inactive_parent_visibility_logic(self) -> None:
        logger = cast(TestLoggerMixin, self)

        parent = self._get_parent()
        parent_name = parent.__class__.__name__

        client = cast(APIClient, getattr(self, "client"))
        url = cast(str, getattr(self, "url"))

        logger._logger_header(
            # f"ENDPOINT GET: Inactive {parent_name} returns 404 for nested endpoint"
            f"ENDPOINT GET: {url}"
        )

        parent.is_active = False
        parent.save(update_fields=["is_active"])

        response = client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

        print(
            f"{logger.INDENT}{logger.COLOR['OK']}"
            f"✓ Inactive {parent_name} hidden | HTTP 404"
            f"{logger.COLOR['END']}"
        )

    def _nonexistent_parent_visibility_logic(self) -> None:
        logger = cast(TestLoggerMixin, self)

        parent = self._get_parent()
        parent_name = parent.__class__.__name__

        client = cast(APIClient, getattr(self, "client"))
        pk_url_name = cast(str, getattr(self, "pk_url_name"))

        url = reverse(
            pk_url_name,
            kwargs=self._get_parent_url_kwargs(999999),
        )

        logger._logger_header(
            f"ENDPOINT GET: {url}"
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

        print(
            f"{logger.INDENT}{logger.COLOR['OK']}"
            f"✓ Nonexistent {parent_name} hidden | HTTP 404"
            f"{logger.COLOR['END']}"
        )
