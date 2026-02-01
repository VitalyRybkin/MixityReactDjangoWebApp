from typing import TYPE_CHECKING

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
        print(f"    {self.COLOR['OK']}✓ String matches: {expected_output}{self.COLOR['END']}")
