from typing import Any

from django.core.validators import RegexValidator
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from phonenumber_field.validators import validate_international_phonenumber


class Driver(models.Model):
    """
    Represents a driver entity related to a carrier entity.

    Defines a driver model, storing information about drivers
    and their association with a carrier. Each driver belongs to a specific carrier.

    Attributes:
        carrier (ForeignKey): The carrier associated with this driver.
        full_name (CharField): The full name of the driver.
        phone (PhoneNumberField): The phone number of the driver.
        passport_number (CharField): The passport number of the driver.
        passport_issue_date (DateField): The issue date of the driver's passport.
        passport_emitted_by (CharField): The issuer of the driver's passport.
    """

    passport_regex = RegexValidator(
        regex=r"^\d{4}\s?\d{6}$",
        message="Passport must be 10 digits (4 for series, 6 for number).",
    )

    carrier = models.ForeignKey(
        "logistic.Carrier",
        on_delete=models.PROTECT,
        related_name="drivers",
    )

    full_name = models.CharField(max_length=100)

    phone = PhoneNumberField(
        region="RU",
        validators=[validate_international_phonenumber],
        null=True,
        blank=True,
    )

    passport_number = models.CharField(
        validators=[passport_regex],
        max_length=11,
        null=True,
        blank=True,
        db_index=True,
        help_text="Format: 1234 567890",
    )

    passport_issue_date = models.DateField(
        null=True,
        blank=True,
        help_text="Passport issue date",
    )

    passport_emitted_by = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        help_text="Passport issuer",
    )

    class Meta:
        indexes = [models.Index(fields=["carrier", "full_name"])]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.passport_number:
            self.passport_number = self.passport_number.replace(" ", "")
        if self.phone:
            self.phone = self.phone.replace(" ", "")
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Водитель: {self.full_name}, {self.carrier}, {self.phone}"
