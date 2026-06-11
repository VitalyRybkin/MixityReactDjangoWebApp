from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object


class ModelContractMixin(_Base):
    """
    Provides a mixin class to test the string representation of a model.

    Used as a utility to validate that a model's __str__ method
    produces the expected string representation. It is intended to be used with
    unit testing frameworks where asserting the correctness of model string outputs
    is required.
    """

    def _str_method_logic(self, expected_output: str) -> None:
        """
        Executes the logic for testing the __str__ method of an object against
        an expected output. Logs the test details, compares the string
        representation of the object with the expected value, and prints a
        result message.

        Parameters:
            expected_output (str): The expected string representation of the object.
        """
        self._logger_header(f"METHOD: __str__ for {self.model.__name__}")
        self.assertEqual(str(self.obj), expected_output)
        self._logger_success(f"{str(self.obj)!r}", "String matches expected")

    def _get_total_logic(self, expected_total: Any) -> None:
        """
        Executes the logic for testing the get_total method/property of an object against
        an expected total. Logs the test details, checks for the presence of the get_total
        method/property, calls it if necessary, and compares the result with the expected value.

        Parameters:
            expected_total (Any): The expected total value.
        """
        self._logger_header(f"METHOD: get_total for {self.model.__name__}")

        self.assertTrue(
            hasattr(self.obj, "get_total"),
            msg=f"Model {self.model.__name__} does not implement the get_total method/property",
        )

        actual_total = self.obj.get_total
        if callable(actual_total):
            actual_total = actual_total()

        self.assertEqual(actual_total, expected_total)
        self._logger_success(
            f"{actual_total!r}", f"Total matches expected: {expected_total}"
        )
