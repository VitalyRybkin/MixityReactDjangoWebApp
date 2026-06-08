from core.tests.base_view_test_case import BaseViewTestCase
from order.serializers.order_serializers.create_order_serializers import (
    OrderReadSerializer,
    OrderWriteSerializer,
)
from order.views.orders import OrderListCreateAPIView, OrderRetrieveUpdateDestroyAPIView


class BaseOrderViewSerializersTestCase(BaseViewTestCase):
    """
    Test case for view serializer classes.

    Attributes:
        _view_class: The view class being tested.
        _cases: A list of test cases, each consisting of a method and its
            expected serializer.

    Methods:
        test_serializer_classes:
            Tests the serializer class for each method and its corresponding
            expected serializer.
    """

    __test__ = False
    _cases = []

    def test_serializer_classes(self) -> None:
        for method, serializer in self._cases:
            with self.subTest(method=method):
                self._assert_serializer_class(
                    method=method,
                    expected_serializer=serializer,
                )


class TestOrderRetrieveUpdateDestroyView(
    BaseOrderViewSerializersTestCase, BaseViewTestCase
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
        ("DELETE", OrderReadSerializer),
    ]


class TestOrderListCreateView(BaseOrderViewSerializersTestCase, BaseViewTestCase):
    """Test class for verifying OrderListCreateAPIView behavior."""

    __test__ = True
    _view_class = OrderListCreateAPIView
    _cases = [
        ("GET", OrderReadSerializer),
        ("POST", OrderWriteSerializer),
    ]
