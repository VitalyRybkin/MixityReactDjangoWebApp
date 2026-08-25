from typing import Any, Callable, cast

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

        self._log_success(
            f"Create with inactive related '{field_name}' rejected | HTTP 400"
        )

    def _assert_inactive_related_hidden_from_list(
        self,
        *,
        field_name: str,
        related_factory: Any,
        object_factory: Any,
        object_factory_kwargs: dict[str, Any] | None = None,
    ) -> None:
        related_obj = related_factory.create(
            is_active=False,
        )

        object_kwargs = dict(object_factory_kwargs or {})
        object_kwargs[field_name] = related_obj

        obj = object_factory.create(**object_kwargs)

        client = cast(APIClient, getattr(self, "client"))
        url = cast(str, getattr(self, "url"))

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK, response.data

        data = response.data
        items = data.get("results", []) if isinstance(data, dict) else data

        ids = [item["id"] for item in items]

        assert obj.pk not in ids

        self._log_success(
            f"Object with inactive related '{field_name}' is hidden from list"
        )

    def _assert_inactive_related_returns_404(
        self,
        *,
        field_name: str,
        related_factory: Any,
        object_factory: Any,
        url_factory: Callable[[Any], str],
        object_factory_kwargs: dict[str, Any] | None = None,
    ) -> None:
        related_obj = related_factory.create(
            is_active=False,
        )

        object_kwargs = dict(object_factory_kwargs or {})
        object_kwargs[field_name] = related_obj

        obj = object_factory.create(**object_kwargs)

        client = cast(APIClient, getattr(self, "client"))

        response = client.get(
            url_factory(obj),
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, response.data

        self._log_success(
            f"Object with inactive related '{field_name}' returns HTTP 404"
        )

    def _log_success(self, message: str) -> None:
        color = cast(dict[str, str], getattr(self, "COLOR"))
        indent = cast(str, getattr(self, "INDENT"))

        print(f"{indent}{color['OK']}✓ {message}{color['END']}")
