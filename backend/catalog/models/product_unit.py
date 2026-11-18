from typing import Any

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import models

from catalog.utils.unit_choices import TitleChoices


class ProductUnit(models.Model):
    ALLOWED_PACK_WEIGHTS = {10, 12, 15, 20, 25, 30}

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
    value = models.PositiveSmallIntegerField(
        help_text="Вес упаковки (кг) или 1 для тонны"
    )

    class Meta:
        verbose_name = "Единица измерения товара"
        verbose_name_plural = "Единицы измерения товаров"

    def clean(self) -> None:
        """Validate pack weight; leave missing FK errors to Django field validation."""
        super().clean()
        if self.unit_id is None:
            return
        try:
            unit_title = self.unit.title
        except ObjectDoesNotExist:
            return
        if unit_title == TitleChoices.PIECE:
            if self.value not in self.ALLOWED_PACK_WEIGHTS:
                raise ValidationError(
                    {"value": f"Вес упаковки: {sorted(self.ALLOWED_PACK_WEIGHTS)} кг"}
                )

    def save(self, *args: Any, **kwargs: Any) -> None:
        # full_clean() must report an invalid FK instead of a descriptor exception.
        if self.unit_id:
            try:
                if self.unit.title == TitleChoices.TON:
                    self.value = 1
            except ObjectDoesNotExist:
                pass
        self.full_clean()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.product.name} ({self.unit.title}) - {self.value}"
