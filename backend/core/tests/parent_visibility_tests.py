from typing import cast

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class ParentVisibilityContractMixin:
    def test_inactive_parent_returns_404(self) -> None:
        obj = getattr(self, "obj")
        client = cast(APIClient, getattr(self, "client"))
        url = cast(str, getattr(self, "url"))

        obj.is_active = False
        obj.save(update_fields=["is_active"])

        response = client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_nonexistent_parent_returns_404(self) -> None:
        client = cast(APIClient, getattr(self, "client"))
        pk_url_name = cast(str, getattr(self, "pk_url_name"))

        url = reverse(
            pk_url_name,
            kwargs={"pk": 999999},
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
