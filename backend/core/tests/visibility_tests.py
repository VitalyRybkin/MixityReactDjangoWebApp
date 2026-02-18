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
            AssertionError: If the API response does not include the active object or if it includes
            the inactive object.
        """
        self._logger_header(f"ENDPOINT GET: {self.url_name}")

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
            f"    {self.COLOR['OK']}✓ Active-only visibility verified{self.COLOR['END']}"
        )


class SoftDeleteContractMixin(_Base):
    detail_url_name: str | None = None

    def get_detail_url(self, pk: Any) -> str:
        assert self.detail_url_name is not None
        return reverse(self.detail_url_name, kwargs={"pk": pk})

    def _assert_soft_delete_via_delete(self) -> None:
        """
        Verifies that calling DELETE on the API endpoint sets the `is_active`
        attribute of the specified object to False without actually removing the object from
        the database. It ensures that the response data reflects the updated `is_active`
        attribute and confirms the HTTP status code of the operation.
        """
        assert self.detail_url_name is not None

        self._logger_header(f"ENDPOINT DELETE: {self.detail_url_name}")

        obj = self.factory.create(is_active=True)
        url = self.get_detail_url(obj.id)

        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 200)

        obj = self.model.all_objects.get(pk=obj.id)
        self.assertFalse(obj.is_active)

        self.assertIn("isActive", resp.data)
        self.assertEqual(resp.data["isActive"], False)

        print(f"    {self.COLOR['OK']}✓ Soft delete verified{self.COLOR['END']}")


class ReadOnlyActiveFieldContractMixin(_Base):
    """
    Verifies that the `is_active` field of a model cannot be modified via a PATCH request
    through the API endpoint. Assumes the existence of certain attributes
    and methods, like `detail_url_name`, `factory`, and `client`, which are typically provided
    by a test framework or the class consuming this mixin.

    Attributes:
        detail_url_name: The name of the URL pattern for the detail endpoint. It is used
            to construct the URL for accessing an individual resource based on its primary key.
    """

    detail_url_name: str | None = None

    def get_detail_url(self, pk: Any) -> str:
        assert self.detail_url_name is not None
        return reverse(self.detail_url_name, kwargs={"pk": pk})

    def _assert_is_active_is_read_only(self) -> None:
        """
        Asserts that the `is_active` attribute of an object is read-only when accessed via a PATCH
        request to the corresponding API endpoint.

        Raises:
            AssertionError: If any of the assertions fail, such as if the `is_active` field is
            successfully modified via the PATCH request or if the response data does not match
            the expected behavior.
        """
        assert self.detail_url_name is not None
        self._logger_header(
            f"ENDPOINT PATCH: {self.detail_url_name} (isActive read-only)"
        )

        obj = self.factory.create(is_active=True)
        url = self.get_detail_url(obj.id)

        resp = self.client.patch(url, data={"isActive": False}, format="json")
        self.assertEqual(resp.status_code, 200)

        obj.refresh_from_db()
        self.assertTrue(
            obj.is_active, msg="is_active changed via PATCH but should be read-only"
        )

        self.assertEqual(resp.data["isActive"], True)

        print(
            f"    {self.COLOR['OK']}✓ isActive is read-only via API{self.COLOR['END']}"
        )
