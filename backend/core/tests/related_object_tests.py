from typing import Any, cast

from rest_framework import status
from rest_framework.test import APIClient


class RelatedObjectContractMixin:
    def _assert_create_with_inactive_related_returns_400(
        self,
        *,
        payload: dict[str, Any],
        field_name: str,
        related_factory: Any,
        related_factory_kwargs: dict[str, Any] | None = None,
    ) -> None:
        related_obj = related_factory.create(
            is_active=False,
            **(related_factory_kwargs or {}),
        )

        payload[field_name] = related_obj.pk

        client = cast(APIClient, getattr(self, "client"))
        url = cast(str, getattr(self, "url"))
        model = cast(Any, getattr(self, "model"))

        count_before = model.objects.count()

        response = client.post(
            url,
            data=payload,
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        assert model.objects.count() == count_before
