from typing import Any

from rest_framework import serializers


def validate_ru_phone(value: Any) -> Any:
    """
    Validates a Russian phone number format ensuring it meets specified criteria.

    Raises an error if the input does not conform to the rules, such as not being
    exactly 11 digits long including the country code.

    Parameters:
        value (Any): The phone number to validate. Can be any type, but is expected
        to have a string representation if provided.

    Returns:
        Any: The validated phone number, returned unchanged if it conforms to
        the validation rules.

    Raises:
        serializers.ValidationError: If the phone number is in an incorrect format
        or does not contain exactly 11 digits.
    """
    if not value:
        return value

    if not value.is_valid():
        raise serializers.ValidationError("Некорректный формат номера.")

    digits_only = "".join(filter(str.isdigit, str(value)))
    if len(digits_only) != 11:
        raise serializers.ValidationError(
            "Номер должен содержать ровно 11 цифр (включая 7)."
        )

    return value