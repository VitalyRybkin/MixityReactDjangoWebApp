from django.db import models


class ProductDescription(models.Model):
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="description_items",
    )
    description_item = models.ForeignKey(
        "catalog.DescriptionItem",
        on_delete=models.CASCADE,
        related_name="description_items",
    )
    description = models.TextField()
    spec_group = models.ManyToManyField(
        "catalog.SpecificationGroup",
        related_name="descriptions",
        through="catalog.TechnicalDescription",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "description_item"],
                name="uniq_product_description",
            )
        ]
        db_table = "orders_app_product_description"
        verbose_name = "Product Description"
        verbose_name_plural = "Product Descriptions"

    def __str__(self) -> str:
        return f"{self.product} - {self.description_item} - {self.spec_group}"
