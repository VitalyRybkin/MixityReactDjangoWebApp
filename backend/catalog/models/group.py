from django.db import models


class ProductGroup(models.Model):
    name = models.CharField(max_length=100)
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="groups"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "name"], name="uniq_product_group"
            )
        ]
        db_table = "catalog_app_product_group"
        verbose_name = "Product Group"
        verbose_name_plural = "Product Groups"

    def __str__(self) -> str:
        return self.name
