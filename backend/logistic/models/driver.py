from typing import Any

from django.core.validators import RegexValidator
from django.db import models


class Driver(models.Model):
    """
    Represents a driver entity related to a carrier entity.

    Defines a driver model, storing information about drivers
    and their association with a carrier. Each driver belongs to a specific carrier.

    :ivar carrier: The carrier associated with this driver.
    :type carrier: ForeignKey
    :ivar full_name: The full name of the driver.
    :type full_name: CharField
    :ivar phone: The phone number of the driver.
    :type phone: CharField
    :ivar passport_number: The passport number of the driver.
    :type passport_number: CharField
    :ivar passport_issue_date: The issue date of the driver's passport.
    :type passport_issue_date: DateField
    :ivar passport_emitted_by: The issuer of the driver's passport.
    :type passport_emitted_by: CharField
    """

    russian_phone_regex = RegexValidator(
        regex=r"^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$",
        message="Format: '+79991234567' or '89991234567'. Exactly 10 digits required after prefix.",
    )

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

    phone = models.CharField(
        validators=[russian_phone_regex],
        max_length=18,
        null=True,
        blank=True,
        help_text="Russian phone number",
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
        null=True, blank=True, help_text="Passport issue date"
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
