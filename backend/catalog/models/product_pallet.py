from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class ProductPallet(models.Model):
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="product_pallets"
    )
    warehouse = models.ForeignKey(
        "stock.Warehouse", on_delete=models.CASCADE, related_name="warehouse_pallets"
    )
    items_per_pallet = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "warehouse"], name="uniq_product_warehouse_pallet"
            )
        ]
        verbose_name = "Паллета (складская)"
        verbose_name_plural = "Паллеты (складские)"

    def clean(self) -> None:
        super().clean()

        if self.items_per_pallet not in {40, 48}:
            raise ValidationError(
                {"items_per_pallet": "Допустимо только 40 или 48 штук."}
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return (
            f"{self.product.name} @ {self.warehouse.name}: {self.items_per_pallet} шт"
        )
