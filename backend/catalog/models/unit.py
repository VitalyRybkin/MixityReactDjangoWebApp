from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from catalog.utils.unit_choices import TitleChoices


class AppUnit(models.Model):

    NON_WEIGHT_UNITS = {
        TitleChoices.PIECE,
        TitleChoices.PALLET,
        TitleChoices.PERCENT,
        TitleChoices.MILLIMETER,
        TitleChoices.MEGAPASCAL,
        TitleChoices.LITRE,
        TitleChoices.KG_PER_M3,
    }

    title = models.CharField(max_length=20, choices=TitleChoices, unique=True)
    is_weight_based = models.BooleanField(default=False)
    to_kg_factor = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "catalog_unit"
        verbose_name = "Единица измерения"
        verbose_name_plural = "Единицы измерения"

    def clean(self) -> None:
        super().clean()

        if self.title == TitleChoices.KILOGRAM:
            if not self.is_weight_based:
                raise ValidationError(
                    {"is_weight_based": "Килограмм должен быть весовым."}
                )
            if self.to_kg_factor != 1:
                raise ValidationError(
                    {"to_kg_factor": "Фактор килограмма должен быть 1."}
                )

        elif self.title == TitleChoices.TON:
            if not self.is_weight_based:
                raise ValidationError({"is_weight_based": "Тонна должна быть весовой."})
            if self.to_kg_factor != 1000:
                raise ValidationError(
                    {"to_kg_factor": "Фактор тонны должен быть 1000."}
                )

        elif self.title in self.NON_WEIGHT_UNITS:
            if self.is_weight_based:
                raise ValidationError(
                    {
                        "is_weight_based": (
                            f"'{self.get_title_display()}' не является базовой весовой единицей."
                        )
                    }
                )
            if self.to_kg_factor != 1:
                raise ValidationError(
                    {
                        "to_kg_factor": (
                            f"'{self.get_title_display()}' не является базовой весовой единицей."
                        )
                    }
                )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title
