from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class AppUnit(models.Model):
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
        verbose_name = "Единица измерения"
        verbose_name_plural = "Единицы измерения"

    def clean(self) -> None:
        if self.title == "kilogram":
            if not self.is_weight_based or self.to_kg_factor != 1:
                raise ValidationError("Килограмм должен быть весовым с фактором 1.")

        elif self.title == "ton":
            if not self.is_weight_based or self.to_kg_factor != 1000:
                raise ValidationError("Тонна должна быть весовой с фактором 1000.")

        elif self.title in {
            "piece",
            "pallet",
            "%",
            "millimeter",
            "megapascal",
            "litre",
            "kg/m3",
        }:
            if self.is_weight_based or self.to_kg_factor != 1:
                raise ValidationError(
                    f"'{self.title}' не является базовой весовой единицей."
                )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.get_title_display()
