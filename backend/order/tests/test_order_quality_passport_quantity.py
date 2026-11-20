"""Quality passport quantity tests."""

from order.tests.quality_passport_test_base import QualityPassportTestBase


class TestOrderQualityPassportQuantity(QualityPassportTestBase):
    __test__ = True

    def test_negative_weight_quantity_rejected(self) -> None:
        self._logger_header("QUANTITY: NEGATIVE WEIGHT")

        self._activate_order()

        product = self._create_quantity_test_product(
            is_piece_based=False,
        )

        self._assert_invalid_quantity_rejected(
            product=product,
            quantity="-10",
        )

        self._logger_success(
            "quantity",
            "Negative weight rejected | 400 | passport unchanged",
        )

    def test_negative_piece_quantity_rejected(self) -> None:
        self._logger_header("QUANTITY: NEGATIVE PIECES")

        self._activate_order()

        product = self._create_quantity_test_product(
            is_piece_based=True,
        )

        self._assert_invalid_quantity_rejected(
            product=product,
            quantity="-10",
        )

        self._logger_success(
            "quantity",
            "Negative pieces rejected | 400 | passport unchanged",
        )

    def test_zero_weight_quantity_rejected(self) -> None:
        self._logger_header("QUANTITY: ZERO WEIGHT")

        self._activate_order()

        product = self._create_quantity_test_product(
            is_piece_based=False,
        )

        self._assert_invalid_quantity_rejected(
            product=product,
            quantity="0",
        )

        self._logger_success(
            "quantity",
            "Zero weight rejected | 400 | passport unchanged",
        )

    def test_zero_piece_quantity_rejected(self) -> None:
        self._logger_header("QUANTITY: ZERO PIECES")

        self._activate_order()

        product = self._create_quantity_test_product(
            is_piece_based=True,
        )

        self._assert_invalid_quantity_rejected(
            product=product,
            quantity="0",
        )

        self._logger_success(
            "quantity",
            "Zero pieces rejected | 400 | passport unchanged",
        )
