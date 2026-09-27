from rest_framework.test import APITestCase

from core.tests.base_view_test_case import BaseViewTestCase
from core.tests.serializer_tests import (
    ExcludedSerializerFieldsContractMixin,
    SerializerSelectionContractMixin,
)
from core.tests.utils import TestLoggerMixin
from order.serializers.order_serializers.create_order_serializers import (
    OrderReadSerializer,
    OrderWriteSerializer,
)
from order.views.orders import OrderListCreateAPIView, OrderRetrieveUpdateDestroyAPIView


class TestOrderRetrieveUpdateDestroySerializers(
    SerializerSelectionContractMixin, BaseViewTestCase
):
    """
    Test case for verifying the behavior of the
    OrderRetrieveUpdateDestroyAPIView with various HTTP methods.
    """

    __test__ = True

    _view_class = OrderRetrieveUpdateDestroyAPIView
    _cases = [
        ("GET", OrderReadSerializer),
        ("PUT", OrderWriteSerializer),
        ("PATCH", OrderWriteSerializer),
        ("DELETE", OrderWriteSerializer),
    ]

    def test_serializer_classes(self) -> None:
        """
        Tests that the GET, PUT, PATCH, and DELETE methods use the expected serializers.
        """
        self._logger_header("SERIALIZERS: ORDER DETAIL")
        self._serializer_classes_logic()
        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ GET / PUT / PATCH / DELETE use expected serializers"
            f"{self.COLOR['END']}"
        )


class TestOrderListCreateSerializers(
    SerializerSelectionContractMixin, BaseViewTestCase
):
    """Test class for verifying OrderListCreateAPIView behavior."""

    __test__ = True

    _view_class = OrderListCreateAPIView
    _cases = [
        ("GET", OrderReadSerializer),
        ("POST", OrderWriteSerializer),
    ]

    def test_serializer_classes(self) -> None:
        """
        Tests that the GET and POST methods use the expected serializers.
        """
        self._logger_header("SERIALIZERS: ORDER LIST / CREATE")
        self._serializer_classes_logic()
        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ GET / POST use expected serializers"
            f"{self.COLOR['END']}"
        )


class TestOrderWriteSerializerSecurity(
    ExcludedSerializerFieldsContractMixin,
    TestLoggerMixin,
    APITestCase,
):
    """
    Tests that the excluded fields are not present in the serializer's fields.
    """

    serializer_class = OrderWriteSerializer

    excluded_fields = (
        "user",
        "upd_pdf",
        "order_products",
    )

    def test_excluded_fields_are_not_exposed(self) -> None:
        """
        Tests that the excluded fields are not present in the serializer's fields.
        """
        self._logger_header("ORDER WRITE SERIALIZER SECURITY")
        self._excluded_fields_are_not_exposed_logic()
        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Protected fields are not exposed: user, upd_pdf, order_products"
            f"{self.COLOR['END']}"
        )
