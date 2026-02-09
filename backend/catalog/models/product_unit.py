from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class ProductUnit(models.Model):
    ALLOWED_BAG_WEIGHTS = {15, 20, 25, 30}

    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    units = models.ForeignKey("catalog.AppUnit", on_delete=models.CASCADE)

    kg_per_unit = models.SmallIntegerField(default=1)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "units"], name="uniq_product_unit"
            )
        ]
        db_table = "orders_app_product_units"

    def clean(self) -> None:
        if self.units.title == "piece":
            if self.kg_per_unit not in self.ALLOWED_BAG_WEIGHTS:
                raise ValidationError(
                    {
                        "kg_per_unit": f"Bag weight must be one of {sorted(self.ALLOWED_BAG_WEIGHTS)} kg"
                    }
                )

        if self.units.title in {"kilogram", "ton", "pallet"}:
            raise ValidationError(
                {
                    "units": "Do not create ProductUnit for kilogram/ton/pallet (they are global weight-based units)."
                }
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.product} ({self.units}) - {self.kg_per_unit} kg"
