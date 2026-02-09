from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class AppUnit(models.Model):
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
        db_table = "catalog_app_unit"

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
