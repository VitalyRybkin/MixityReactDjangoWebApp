from multiprocessing.util import is_exiting
from typing import Dict, Any
from typing import TYPE_CHECKING

from rest_framework import status
from rest_framework.reverse import reverse

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
    def _create_logic(self, payload: Dict[str, Any], expected_status: int = status.HTTP_201_CREATED,) -> None:
        """
        Executes the logic for creating an object via a POST request and verifies the response status.

        Parameters
        ----------
        payload : Dict[str, Any]
            The data to be sent in the POST request payload.
        """
        self._logger_header(f"ENDPOINT POST: {self.url_name}")
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, expected_status, msg=f"API returned status code {response.status_code}",)

        is_created = self.model.objects.filter(pk=response.data["id"]).exists()
        self.assertTrue(is_created, msg="Object was not created successfully")

        print(f"    {self.COLOR['OK']}✓ Object created successfully{self.COLOR['END']}")

    def _retrieve_object_by_id(self) -> None:
        self._logger_header(f"ENDPOINT GET: {self.detail_url_name if self.detail_url_name else '' + f'/{self.obj.id}'}")

        url = self.get_detail_url(self.obj.id)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.obj.id)

        print(f"    {self.COLOR['OK']}✓ Object successfully retrieved{self.COLOR['END']}")

    def _retrieve_object_by_id_not_found(self) -> None:
        self._logger_header(f"ENDPOINT GET: {self.detail_url_name if self.detail_url_name else '' + f'/{self.obj.id}'}")

        url = self.get_detail_url(pk=9999)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        print(f"    {self.COLOR['OK']}✓ Object not found successfully{self.COLOR['END']}")

    def get_detail_url(self, pk: Any) -> str:
        raise NotImplementedError
