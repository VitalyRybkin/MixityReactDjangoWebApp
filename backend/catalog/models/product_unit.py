from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from catalog.utils.unit_choices import TitleChoices


class ProductUnit(models.Model):
    ALLOWED_BAG_WEIGHTS = {15, 20, 25, 30}

    product = models.OneToOneField(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="unit_config",
    )
    unit = models.ForeignKey(
        "catalog.AppUnit",
        on_delete=models.PROTECT,
        limit_choices_to={"title__in": ["piece", "ton"]},
    )
    value = models.PositiveSmallIntegerField(help_text="Вес мешка (кг) или 1 для тонны")

    class Meta:
        verbose_name = "Единица измерения товара"
        verbose_name_plural = "Единицы измерения товаров"

    def clean(self) -> None:
        if self.unit.title == TitleChoices.PIECE:
            if self.value not in self.ALLOWED_BAG_WEIGHTS:
                raise ValidationError(
                    {"value": f"Вес мешка: {sorted(self.ALLOWED_BAG_WEIGHTS)} кг"}
                )

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.unit_id and self.unit.title == TitleChoices.TON:
            self.value = 1
        self.full_clean()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.product.name} ({self.unit.title}) - {self.value}"
