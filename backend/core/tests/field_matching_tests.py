from decimal import Decimal
from typing import Dict, Any, Iterator, Tuple
from typing import TYPE_CHECKING

from django.db import models

from core.tests.utils import coerce_fieldspec, FieldSpec

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


class FieldContractMixin(_Base):
    """
    Mixin class designed to provide field mapping and validation functionality.

    Facilitates the handling of field specifications and their
    validation against model values. Allows for the normalization and comparison of
    API values and model values, ensuring data integrity when working with API responses.
    The class also assists in verifying the structure and content of API responses.

    Attributes:
        fields_map: A dictionary mapping API field names to their specifications.
    """
    fields_map: Dict[str, Any] = {}

    def _iter_specs(self) -> Iterator[tuple[str, Any]]:
        for api_field, raw in self.fields_map.items():
            yield api_field, coerce_fieldspec(raw)

    def _normalize_for_compare(
            self,
            spec: FieldSpec,
            api_value: Any,
            model_value: Any,
    ) -> Tuple[Any, Any]:

        def norm(v: Any) -> Any:
            if isinstance(v, models.Model):
                return v.pk

            if isinstance(v, dict) and "id" in v:
                return v["id"]

            return v

        api_value = norm(api_value)
        model_value = norm(model_value)

        if spec.cast is Decimal:
            a = Decimal(api_value) if api_value is not None else None
            m = Decimal(model_value) if model_value is not None else None
            return a, m

        if spec.cast is not None:
            return spec.normalize(api_value), spec.normalize(model_value)

        return api_value, model_value

    def _get_list_logic(self) -> None:
        """
        Asserts the correctness of the GET method for an endpoint, ensuring that the returned data is correctly formatted
        and matches the expected model values defined by specifications.

        Raises
        ------
        AssertionError
            If the HTTP status code is not 200, if the response data is not a list, if the list is empty, if fields do
            not match between the API response and model, or if normalization results differ.

        """
        self._logger_header(f"ENDPOINT GET: {self.url_name}")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        self.assertTrue(
            isinstance(response.data, list) and len(response.data) > 0,
            msg="GET list returned empty result; cannot validate fields_map",
        )
        item = response.data[0]

        for api_field, spec in self._iter_specs():
            api_val = item.get(api_field)
            model_val = getattr(self.obj, spec.model_field)

            api_norm, model_norm = self._normalize_for_compare(spec, api_val, model_val)
            self.assertEqual(api_norm, model_norm, msg=f"Mismatch for field '{api_field}'")

            if api_field == "isActive":
                self.assertEqual(api_val, True, msg=f"Mismatch for field '{api_field}'")


        print(f"    {self.COLOR['OK']}✓ List verified ({len(self.fields_map)} fields){self.COLOR['END']}")
