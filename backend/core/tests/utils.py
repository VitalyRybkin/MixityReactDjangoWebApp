from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Callable, Optional, Union

if TYPE_CHECKING:
    from core.tests.type_stubs import BaseMixinProto as _Base
else:
    _Base = object

CastFn = Union[type, Callable[[Any], Any]]


@dataclass(frozen=True, slots=True)
class FieldSpec:
    """
    Represents a specification for a data model field.

    Defines the characteristics of a data model field including its
    name, any casting function to be applied, whether it's required, and its
    uniqueness. It is immutable and designed for efficient use, ensuring that
    its attributes cannot be modified after instantiation.

    Attributes:
        model_field (str): The name of the field as it appears in the model.
        cast (Optional[CastFn]): An optional function to transform the value of
            the field. Defaults to None.
        required (bool): Indicates whether this field is mandatory. Defaults to
            False.
        unique (bool): Specifies whether the field must have unique values
            across records. Defaults to False.

    Methods:
        normalize(value: Any) -> Any:
            Returns a normalized value for the field based on the cast function
            if provided. If no cast function is set or the input value is None,
            it returns the value unchanged.
    """

    model_field: str
    cast: Optional[CastFn] = None
    required: bool = False
    unique: bool = False

    def normalize(self, value: Any) -> Any:
        if value is None or self.cast is None:
            return value
        return self.cast(value)


def coerce_fieldspec(raw: Any) -> FieldSpec:
    """
    Coerces a raw input into a FieldSpec instance.

    Ensures that the raw input, which might be already a FieldSpec instance
    or a tuple, is properly validated and returned as a FieldSpec object. If the input
    format does not meet the expected criteria, a TypeError is raised.

    Arguments:
        raw (Any): An input that can be either a FieldSpec instance or a tuple
                   containing field details.
    Returns:
        FieldSpec: An instance of FieldSpec constructed from the given input.
    Raises:
        TypeError: If the raw input does not conform to the expected FieldSpec format.
    """
    if isinstance(raw, FieldSpec):
        return raw

    if isinstance(raw, tuple) and len(raw) >= 2:
        model_field = raw[0]
        cast = raw[1]
        required = bool(raw[2]) if len(raw) > 2 else False
        unique = bool(raw[3]) if len(raw) > 3 else False
        return FieldSpec(
            model_field=model_field, cast=cast, required=required, unique=unique
        )

    raise TypeError(f"Invalid fields_map entry: {raw!r}")


class TestLoggingMixin(_Base):
    """
    Provides a mixin for enhanced logging functionality with color-coded output.

    Mixin to add formatted logging features to other classes. Supports colored log messages for headers, subheaders,
    success messages, and error messages using ANSI escape codes. It is not intended to be
    used as a standalone class and should be combined with other classes.

    Attributes:
        COLOR (dict): A dictionary defining ANSI color codes for different logging
        levels and message types.
    """

    COLOR = {
        "HEAD": "\033[1;34m",
        "SUB": "\033[1;36m",
        "OK": "\033[0;32m",
        "ERR": "\033[1;31m",
        "END": "\033[0m",
    }

    def _logger_header(self, title: str, level: int = 0) -> None:
        """Prints a formatted header message with a color-coded prefix."""
        indent = "  " * level
        prefix = "➔" if level == 0 else "↳"
        color = self.COLOR["HEAD"] if level == 0 else self.COLOR["SUB"]
        start_nl = "\n" if level == 0 else ""
        print(f"{start_nl}{indent}{color}{prefix} {title}{self.COLOR['END']}")

    def _logger_success(self, field_name: str, msg: str) -> None:
        """Prints a formatted success message with a color-coded field name."""
        print(f"      {self.COLOR['OK']}✓ {field_name:12} | {msg}{self.COLOR['END']}")
