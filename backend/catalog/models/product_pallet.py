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
                fields=["product", "warehouse"],
                name="uniq_product_warehouse_pallet",
            )
        ]
        ordering = ["product", "warehouse"]
        verbose_name = "Product Pallet"
        verbose_name_plural = "Product Pallets"
