from __future__ import annotations

from typing import TYPE_CHECKING, Any

from rest_framework.reverse import reverse

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


class ActiveVisibilityContractMixin(_Base):
    """
    Provides utility to ensure that only objects marked as active are
    returned in API list responses. It is intended to be used as part of test cases
    where such behavior needs to be validated.
    """

    def _assert_active_only_in_list(self) -> None:
        """
        Validates that only active objects are included in the visible list response provided by the API
        endpoint. This method verifies the correct filtering behavior of the endpoint by ensuring that
        inactive objects do not appear in the response data.

        Raises:
            AssertionError: If the API response does not include the active object, or if it includes
            the inactive object.
        """
        assert self.url_name is not None
        self._logger_header(f"ENDPOINT GET: {reverse(self.url_name)}")

        active = self.factory.create(is_active=True)
        inactive = self.factory.create(is_active=False)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        data = response.data
        items = (
            data["results"] if isinstance(data, dict) and "results" in data else data
        )
        ids = {item["id"] for item in items}

        self.assertIn(active.id, ids, msg="Active object missing from list response")
        self.assertNotIn(
            inactive.id, ids, msg="Inactive object leaked into list response"
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ Active-only visibility verified{self.COLOR['END']}"
        )


class SoftDeleteContractMixin(_Base):
    pk_url_name: str | None = None

    def get_detail_url(self, pk: Any) -> str:
        assert self.pk_url_name is not None
        return reverse(self.pk_url_name, kwargs={"pk": pk})

    def _assert_soft_delete_via_delete(self) -> None:
        """
        Verifies that calling DELETE on the API endpoint sets the `is_active`
        attribute of the specified object to False without actually removing the object from
        the database. It ensures that the response data reflects the updated `is_active`
        attribute and confirms the HTTP status code of the operation.
        """
        assert self.pk_url_name is not None

        self._logger_header(f"ENDPOINT DELETE: {self.pk_url_name}")

        obj = self.factory.create(is_active=True)
        url = self.get_detail_url(obj.id)

        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 200)

        obj = self.model.all_objects.get(pk=obj.id)
        self.assertFalse(obj.is_active)

        self.assertIn("isActive", resp.data)
        self.assertEqual(resp.data["isActive"], False)

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ Soft delete verified{self.COLOR['END']}"
        )


class ReadOnlyActiveFieldContractMixin(_Base):
    """
    Verifies that the `is_active` field of a model cannot be modified via a PATCH request
    through the API endpoint. Assumes the existence of certain attributes
    and methods, like `detail_url_name`, `factory`, and `client`, which are typically provided
    by a test framework or the class consuming this mixin.

    Attributes:
        pk_url_name (str | None): The name of the URL pattern for the detail view of the model.
    """

    pk_url_name: str | None = None

    def get_detail_url(self, pk: Any) -> str:
        assert self.pk_url_name is not None
        return reverse(self.pk_url_name, kwargs={"pk": pk})

    def _assert_is_active_is_read_only(self) -> None:
        """
        Asserts that the `is_active` attribute of an object is read-only when accessed via a PATCH
        request to the corresponding API endpoint.

        Raises:
            AssertionError: If any of the assertions fail, such as if the `is_active` field is
            successfully modified via the PATCH request or if the response data does not match
            the expected behavior.
        """
        self._assert_field_is_read_only(
            api_field="isActive",
            model_field="is_active",
            value=False,
        )

    def _assert_field_is_read_only(
            self,
            *,
            api_field: str,
            model_field: str,
            value: Any,
            request_format: str = "json",
    ) -> None:
        self.obj.refresh_from_db()

        original_field_value = getattr(
            self.obj,
            model_field,
        )
        original_value = getattr(
            original_field_value,
            "name",
            original_field_value,
        )

        self._logger_header(
            f"READ ONLY PATCH: {self.url} [{api_field}]"
        )

        response = self.client.patch(
            self.url,
            data={
                api_field: value,
            },
            format=request_format,
        )

        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )

        self.obj.refresh_from_db()

        current_field_value = getattr(
            self.obj,
            model_field,
        )
        current_value = getattr(
            current_field_value,
            "name",
            current_field_value,
        )

        self.assertEqual(
            current_value,
            original_value,
            msg=f"{model_field} changed via PATCH but should be read-only",
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            f"✓ Field '{api_field}' is read-only via API"
            f"{self.COLOR['END']}"
        )


class InactiveObjectVisibilityContractMixin(_Base):
    def _assert_inactive_object_returns_404(
        self,
        *,
        method: str = "get",
        payload: dict[str, Any] | None = None,
        request_format: str = "json",
    ) -> None:
        self.obj.is_active = False
        self.obj.save(update_fields=["is_active"])

        self._logger_header(f"OBJECT VISIBILITY {method.upper()}: {self.url}")

        request = getattr(
            self.client,
            method.lower(),
        )

        kwargs: dict[str, Any] = {}

        if payload is not None:
            kwargs["data"] = payload
            kwargs["format"] = request_format

        response = request(
            self.url,
            **kwargs,
        )

        self.assertEqual(
            response.status_code,
            404,
            response.data,
        )

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Inactive object hidden | HTTP 404"
            f"{self.COLOR['END']}"
        )
