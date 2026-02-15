from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class AppUnit(models.Model):
    """
    Represents a unit of measurement used in the catalog with various configurations such as weight-based and
    non-weight-based units.

    Attributes:
        title (str): The name of the unit of measurement. Must be one of the predefined choices from TitleChoices.
        is_weight_based (bool): Determines whether the unit is weight-based. Defaults to False.
        to_kg_factor (int): The conversion factor to kilograms, applicable for weight-based units. Defaults to 1.

    Meta:
        db_table: Specifies the name of the database table as "catalog_unit".
    """

    class TitleChoices(models.TextChoices):
        PIECE = "piece", "шт"
        KILOGRAM = "kilogram", "кг"
        TON = "ton", "т"
        PALLET = "pallet", "пал"
        PERCENT = "%", "%"
        MILLIMETER = "millimeter", "мм"
        MEGAPASCAL = "megapascal", "МПа"
        LITRE = "litre", "л"
        KG_PER_M3 = "kg/m3", "кг/м3"

    title = models.CharField(max_length=20, choices=TitleChoices, unique=True)
    is_weight_based = models.BooleanField(default=False)
    to_kg_factor = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "catalog_unit"

    def clean(self) -> None:
        """
        Validates consistency of unit attributes based on predefined business rules for
        specific units. The validation ensures that the unit's attributes meet the
        required conditions to prevent inconsistent or invalid configurations.

        Raises
        ------
        ValidationError
            If the unit's attributes do not satisfy the predefined rules for the
            respective unit type. Specific conditions include:
            - "kilogram" must be weight-based and have a `to_kg_factor` of 1.
            - "ton" must be weight-based and have a `to_kg_factor` of 1000.
            - Units such as "piece", "pallet", "%", "millimeter", "megapascal", "litre",
              "kg/m3" must NOT be weight-based and must have a `to_kg_factor` of 1.
        """
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

        if self.title in {
            "piece",
            "pallet",
            "%",
            "millimeter",
            "megapascal",
            "litre",
            "kg/m3",
        }:
            if self.is_weight_based:
                raise ValidationError(
                    {
                        "is_weight_based": f"'{self.title.capitalize()}' must NOT be weight-based"
                    }
                )
            if self.to_kg_factor != 1:
                raise ValidationError(
                    {
                        "to_kg_factor": f"'{self.title.capitalize()}' must keep to_kg_factor=1 (non-weight unit)"
                    }
                )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title
