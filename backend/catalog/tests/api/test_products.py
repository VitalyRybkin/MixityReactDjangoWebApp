from catalog.models import Product
from catalog.tests.api.factories import ProductFactory
from core.tests.base_test_case import BaseAPIMixin
from core.tests.utils import FieldSpec


class TestProductAPIList(BaseAPIMixin):
    __test__ = True
    url_name = "product_list_create"
    model = Product
    factory = ProductFactory
    fields_map = {
        "id": FieldSpec("id", int),
        "name": FieldSpec("name", str, required=True),
        "title": FieldSpec("title", str, required=True),
        # "product_group": FieldSpec("product_group", str, required=True),
        # "product_image": FieldSpec("product_image", str),
        "forWeb": FieldSpec("for_web", bool),
        "isPieceBased": FieldSpec("is_piece_based", bool),
    }

    def test_get_list(self) -> None:
        """Test that we can get a list of products."""
        return self._get_list_logic()
