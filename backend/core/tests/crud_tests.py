from typing import TYPE_CHECKING, Any, Dict

import pytest
from rest_framework import status
from rest_framework.reverse import reverse

from .contracts import UploadSpec

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


@pytest.mark.usefixtures("temp_media_root")
class CrudContractMixin(_Base):
    """
    Mixin class providing CRUD functionalities for a specific contract.

    Standardizes and facilitates the testing of
    CRUD operations in an endpoint, ensuring consistent implementation
    and response validation for the contract. Intended for use in
    testing frameworks where POST, GET, PUT and DELETE operations
    need to be performed and verified.

    """

    def _create_logic(
        self,
        payload: Dict[str, Any],
        expected_status: int = status.HTTP_201_CREATED,
    ) -> None:
        """
        Executes the logic for creating an object via a POST request and verifies the response status.

        Parameters
        ----------
        payload : Dict[str, Any]
            The data to be sent in the POST request payload.
        """
        self._logger_header(f"ENDPOINT POST: {self.url_name}")
        response = self.client.post(self.url, data=payload, format="json")
        if response.status_code != expected_status:
            print(f"\n{self.COLOR['ERR']}FAILED PAYLOAD:{self.COLOR['END']}", payload)
            print(f"{self.COLOR['ERR']}API ERRORS:{self.COLOR['END']}", response.data)
        self.assertEqual(
            response.status_code,
            expected_status,
            msg=f"API returned status code {response.status_code}",
        )

        is_created = self.model.objects.filter(pk=response.data["id"]).exists()
        self.assertTrue(is_created, msg="Object was not created successfully")

        print(f"    {self.COLOR['OK']}✓ Object created successfully{self.COLOR['END']}")

    def _retrieve_object_by_id(self, obj: Any = None) -> None:
        obj = obj or self.obj

        self._logger_header(f"ENDPOINT GET: {self.detail_url_name}/{obj.id}")

        url = self.get_detail_url(obj.id)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], obj.id)

        print(
            f"    {self.COLOR['OK']}✓ Object successfully retrieved{self.COLOR['END']}"
        )

    def _retrieve_object_by_id_not_found(self) -> None:
        """
        Sends a GET request to retrieve an object with an invalid ID and
        validates that the server returns a 404 NOT FOUND status code. It ensures
        that the API behaves as expected when attempting to access a nonexistent
        object.

        Raises:
            AssertionError: If the API response status code does not match the
            expected 404 NOT FOUND status.
        """
        self._logger_header(
            f"ENDPOINT GET: {self.detail_url_name if self.detail_url_name else '' + f'/{self.obj.id}'}"
        )

        url = self.get_detail_url(pk=9999)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        print(
            f"    {self.COLOR['OK']}✓ Object not found successfully{self.COLOR['END']}"
        )

    def _get_resources_logic(
        self,
        obj: Any = None,
        *,
        expected_trucks: int | None = None,
        expected_drivers: int | None = None,
    ) -> None:
        """
        Handles the logic for fetching and validating resources associated with an object.

        The method retrieves resource data for the given object through a GET request,
        validates the response structure, and optionally asserts the expected number of
        trucks and drivers available in the response.

        Args:
            obj (Optional[Any]): The object for which resources are being fetched. Defaults to None.
            expected_trucks (Optional[int]): The expected number of trucks in the response. Defaults to None.
            expected_drivers (Optional[int]): The expected number of drivers in the response. Defaults to None.

        Returns:
            None
        """
        obj = obj or self.obj

        self._logger_header(f"ENDPOINT GET: {self.detail_url_name}/{obj.id}")

        url = self.get_detail_url(obj.id)
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)

        assert "trucks" in response.data
        assert "drivers" in response.data

        assert isinstance(response.data["trucks"], list)
        assert isinstance(response.data["drivers"], list)

        if expected_trucks is not None:
            assert len(response.data["trucks"]) == expected_trucks

        if expected_drivers is not None:
            assert len(response.data["drivers"]) == expected_drivers

        if response.data["trucks"]:
            assert isinstance(response.data["trucks"][0], dict)
            assert "id" in response.data["trucks"][0]

        if response.data["drivers"]:
            assert isinstance(response.data["drivers"][0], dict)

        print(
            f"    {self.COLOR['OK']}✓ Resources verified "
            f"(trucks={len(response.data['trucks'])}, drivers={len(response.data['drivers'])})"
            f"{self.COLOR['END']}"
        )

    def get_detail_url(self, pk: int) -> str:
        assert (
            self.detail_url_name is not None
        ), "detail_url_name must be set for detail endpoints"
        return reverse(self.detail_url_name, kwargs={"pk": pk})

    def _upload_map_success(
        self,
        payload: Dict[str, Any],
        spec: UploadSpec,
        expected_status: int = status.HTTP_200_OK,
    ) -> None:

        self._logger_header(f"ENDPOINT PATCH: {self.detail_url_name}/{self.obj.id}")

        resp = self.client.patch(
            self.url,
            data=payload,
            format="multipart",
        )

        self.assertEqual(resp.status_code, expected_status)

        self.obj.refresh_from_db()
        self.assertTrue(self.obj.directions.name)
        self.assertIn(spec.upload_to, self.obj.directions.name)

        print(f"    {self.COLOR['OK']}✓ Map uploaded successfully{self.COLOR['END']}")

    def _upload_map_missing_file_400(
        self,
        spec: UploadSpec,
    ) -> None:
        self._logger_header(f"ENDPOINT PATCH: {self.detail_url_name}/{self.obj.id}")

        resp = self.client.patch(self.url, data={}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(spec.field_name, resp.data)

        print(
            f"    {self.COLOR['OK']}✓ Missing file validation passed{self.COLOR['END']}"
        )
