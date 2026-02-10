from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class AppUnit(models.Model):
    """
    Represents a measurement unit for cataloging purposes.

    Defines various title choices for different unit types, provides
    validation rules for weight-based and non-weight-based units, and manages
    their consistency through the database. Weight-based units, such as kilogram
    or ton, must adhere to predefined rules like fixed conversion factors. Non-weight
    units, such as piece or pallet, have separate constraints. Ensures the correctness of unit data before
    saving the instance in the database.

    Attributes:
        TITLE_CHOICES: List of tuples containing the predefined choices for
            unit titles and their corresponding labels.
        title: A string field representing the title of the unit, limited to 20
            characters and unique within the database.
        is_weight_based: A boolean field denoting if the unit is weight-based.
        to_kg_factor: An integer field specifying the conversion factor of the
            chosen unit to kilograms.

    Raises:
        ValidationError: Raised during the `clean` method if the weight-based
            rules for specific units like "kilogram", "ton", or non-weight-based
            units like "piece", "pallet" are violated.
    """

    TITLE_CHOICES = [
        ("piece", "шт"),
        ("kilogram", "кг"),
        ("ton", "т"),
        ("pallet", "пал"),
        ("%", "%"),
        ("millimeter", "мм"),
        ("megapascal", "МПа"),
        ("litre", "л"),
        ("kg/m3", "кг/м3"),
    ]

    title = models.CharField(max_length=20, choices=TITLE_CHOICES, unique=True)
    is_weight_based = models.BooleanField(default=False)
    to_kg_factor = models.SmallIntegerField(default=1)

    class Meta:
        db_table = "catalog_unit"

    def clean(self) -> None:
        # weight-based units must have fixed factors
        if self.title == "kilogram":
            if not self.is_weight_based:
                raise ValidationError(
                    {"is_weight_based": "kilogram must be weight-based"}
                )
            if self.to_kg_factor != 1:
                raise ValidationError(
                    {"to_kg_factor": "kilogram must have to_kg_factor=1"}
                )

        if self.title == "ton":
            if not self.is_weight_based:
                raise ValidationError({"is_weight_based": "ton must be weight-based"})
            if self.to_kg_factor != 1000:
                raise ValidationError(
                    {"to_kg_factor": "ton must have to_kg_factor=1000"}
                )

        # non-weight units should not define global factors
        if self.title in {"piece", "pallet"}:
            if self.is_weight_based:
                raise ValidationError(
                    {"is_weight_based": f"{self.title} must NOT be weight-based"}
                )
            if self.to_kg_factor != 1:
                raise ValidationError(
                    {
                        "to_kg_factor": f"{self.title} must keep to_kg_factor=1 "
                        f"(per-product values live in ProductUnit)"
                    }
                )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"ЕДИНИЦА ИЗМЕРЕНИЯ: {self.title}"
