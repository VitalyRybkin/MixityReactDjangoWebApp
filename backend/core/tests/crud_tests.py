from typing import TYPE_CHECKING, Any, Dict

import pytest
from rest_framework import status
from rest_framework.reverse import reverse

from .utils import UploadSpec

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


class CrudContractMixin(_Base):
    """
    Mixin class providing CRUD functionalities for a specific contract.

    Standardizes and facilitates the testing of
    CRUD operations in an endpoint, ensuring consistent implementation
    and response validation for the contract. Intended for use in
    testing frameworks where POST, GET, PUT and DELETE operations
    need to be performed and verified.
    """

    def get_detail_url(self, pk: int) -> str:
        """Returns the URL for retrieving a specific object by ID."""
        self.assertTrue(
            self.pk_url_name is not None,
            "detail_url_name must be set for detail endpoints",
        )
        assert self.pk_url_name is not None
        return reverse(self.pk_url_name, kwargs={"pk": pk})

    def _create_logic(
        self,
        payload: Dict[str, Any],
        expected_status: int = status.HTTP_201_CREATED,
    ) -> None:
        """
        Executes the logic for creating an object via a POST request and verifies the response status.

        Args:
            payload (Dict[str, Any]): The payload to be sent in the request body.
            expected_status (int, optional): The expected status code for the request. Defaults to 201 Created.
        """
        self._logger_header(f"ENDPOINT POST: {self.url_name}")

        response = self.client.post(self.url, data=payload, format="json")
        if response.status_code != expected_status:
            self.fail(f"PATCH failed\nPayload: {payload}\nErrors: {response.data}")

        is_created = self.model.objects.filter(pk=response.data["id"]).exists()
        self.assertTrue(is_created, msg="Object was not created successfully")

        print(f"    {self.COLOR['OK']}✓ Object created successfully{self.COLOR['END']}")

    def _retrieve_object_by_id(self, obj: Any = None) -> None:
        """
        Retrieves an object by its ID from a specified endpoint and validates the response.
        The method uses the HTTP GET request to fetch the details and checks that the
        response status is HTTP 200 OK and that the object's ID matches in the response.

        Args:
            obj: An optional object to retrieve. If not provided, defaults to the
                object's instance associated with the class.
        """
        obj = obj or self.obj

        self._logger_header(f"ENDPOINT GET: {self.pk_url_name}/{obj.id}")

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
        suffix = f"/{self.obj.id}" if self.obj else ""
        name = self.pk_url_name or ""
        self._logger_header(f"ENDPOINT GET: {name}{suffix}")

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
        Retrieves resource data for the given object through a GET request,
        validates the response structure, and optionally asserts the expected number of
        trucks and drivers available in the response.

        Args:
            obj (Optional[Any]): The object for which resources are being fetched. Defaults to None.
            expected_trucks (Optional[int]): The expected number of trucks in the response. Defaults to None.
            expected_drivers (Optional[int]): The expected number of drivers in the response. Defaults to None.
        """
        obj = obj or self.obj

        self._logger_header(f"ENDPOINT GET: {self.pk_url_name}/{obj.id}")

        url = self.get_detail_url(obj.id)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertTrue(isinstance(response.data, dict))

        self.assertIn("trucks", response.data, msg="Response keys mismatch")
        self.assertIn("drivers", response.data, msg="Response keys mismatch")

        self.assertTrue(isinstance(response.data["trucks"], list))
        self.assertTrue(isinstance(response.data["drivers"], list))

        if expected_trucks is not None:
            self.assertEqual(len(response.data["trucks"]), expected_trucks)

        if expected_drivers is not None:
            self.assertEqual(len(response.data["drivers"]), expected_drivers)

        if response.data["trucks"]:
            self.assertTrue(isinstance(response.data["trucks"][0], dict))
            self.assertIn("id", response.data["trucks"][0], msg="Truck ID missing")

        if response.data["drivers"]:
            self.assertTrue(isinstance(response.data["drivers"][0], dict))

        print(
            f"    {self.COLOR['OK']}✓ Resources verified "
            f"(trucks={len(response.data['trucks'])}, drivers={len(response.data['drivers'])})"
            f"{self.COLOR['END']}"
        )

    @pytest.mark.usefixtures("temp_media_root")
    def _upload_map_success(
        self,
        payload: Dict[str, Any],
        spec: UploadSpec,
        expected_status: int = status.HTTP_200_OK,
    ) -> None:
        """
        Uploads a map file to a specific endpoint and verifies the status code and the upload
        success. This helper method is used to test the success scenario of uploading a map file
        with specified payload and metadata.

        Args:
            payload (Dict[str, Any]): A dictionary containing the data to be uploaded.
            spec (UploadSpec): Metadata specifications detailing information about the upload, such as
                file destination routing.
            expected_status (int, optional): Expected HTTP status code for the upload operation. Defaults
                to 200 (HTTP_200_OK).
        """
        self._logger_header(f"ENDPOINT PATCH: {self.pk_url_name}/{self.obj.id}")

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
        """
        Handles the testing of missing file validation for the specified endpoint. This method
        validates that a `400 Bad Request` status code is returned when a required file
        is missing in the multipart request.

        Args:
            spec (UploadSpec): An instance of UploadSpec containing details about the upload
                 specification, such as the expected field name.
        """
        self._logger_header(f"ENDPOINT PATCH: {self.pk_url_name}/{self.obj.id}")

        resp = self.client.patch(self.url, data={}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(spec.field_name, resp.data)

        print(
            f"    {self.COLOR['OK']}✓ Missing file validation passed{self.COLOR['END']}"
        )

    def _patch_logic(self, payload: dict[str, Any] | None = None) -> None:
        """
        Handles the testing of the PATCH logic for the specified endpoint. This method
        validates that a `200 OK` status code is returned when a valid payload is provided.

        Args:
            payload (dict[str, Any] | None): The payload to be used for the PATCH request.
            If None, a default payload will be used.
        """
        obj = self.factory.create()
        self._logger_header(f"ENDPOINT PATCH: {self.pk_url_name}/{obj.id}")
        url = self.get_detail_url(obj.id)
        self.assertTrue(payload, msg="Provide patch payload for this resource")
        response = self.client.patch(url, data=payload, format="json")
        if response.status_code != 200:
            self.fail(f"PATCH failed\nPayload: {payload}\nErrors: {response.data}")

        print(f"    {self.COLOR['OK']}✓ PATCH logic passed{self.COLOR['END']}")

    def _delete_logic(self, expected_status: int = 200) -> None:
        """
        Deletes an object by making a DELETE request to the corresponding endpoint and verifies
        the operation's result by comparing the response status code with the expected value.

        Args:
            expected_status (int): Expected HTTP status code to validate the DELETE operation.
        """
        obj = self.factory.create()
        self._logger_header(f"ENDPOINT DELETE: {self.pk_url_name}/{obj.id}")
        url = self.get_detail_url(obj.id)
        response = self.client.delete(url)
        if response.status_code != expected_status:
            self.fail(f"DELETE failed\nErrors: {response.data}")

        print(f"    {self.COLOR['OK']}✓ DELETE logic passed{self.COLOR['END']}")

    def _create_invalid_xor_both(self, payload: dict[str, Any] | None = None) -> None:
        """
        Creates a test case to validate the API behavior when both 'Carrier' and
        'Warehouse' fields are provided, ensuring the XOR constraint is correctly
        enforced. This test expects an HTTP 400 response from the server.

        Args:
            payload (dict[str, Any] | None): The payload to be used for the POST request.
        """
        self._logger_header(f"ENDPOINT POST: {self.url_name}")

        resp = self.client.post(self.url, data=payload, format="json")

        self.assertEqual(resp.status_code, 400)
        self.assertIn("non_field_errors", resp.data)
        print(
            f"      {self.COLOR['OK']}✓ Correctly rejected double parent assignment.{self.COLOR['END']}"
        )
