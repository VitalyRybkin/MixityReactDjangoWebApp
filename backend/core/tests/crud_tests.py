from typing import Dict, Any
from typing import TYPE_CHECKING

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
    def _create_logic(self, payload: Dict[str, Any]) -> None:
        """
        Executes the logic for creating an object via a POST request and verifies the response status.

        Parameters
        ----------
        payload : Dict[str, Any]
            The data to be sent in the POST request payload.
        """
        self._logger_header(f"ENDPOINT POST: {self.url_name}")
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, 201)
        print(f"    {self.COLOR['OK']}✓ Object created successfully{self.COLOR['END']}")
