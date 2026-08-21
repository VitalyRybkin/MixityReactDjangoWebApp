from typing import Any, cast

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class ParentVisibilityContractMixin:
    def _get_parent(self) -> Any:
        return getattr(self, "obj")

    def _get_parent_url_kwargs(self, parent_pk: int) -> dict[str, Any]:
        return {"pk": parent_pk}

    def test_inactive_parent_returns_404(self) -> None:
        parent = self._get_parent()
        client = cast(APIClient, getattr(self, "client"))
        url = cast(str, getattr(self, "url"))

        parent.is_active = False
        parent.save(update_fields=["is_active"])

        response = client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_nonexistent_parent_returns_404(self) -> None:
        client = cast(APIClient, getattr(self, "client"))
        pk_url_name = cast(str, getattr(self, "pk_url_name"))

        url = reverse(
            pk_url_name,
            kwargs=self._get_parent_url_kwargs(999999),
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
