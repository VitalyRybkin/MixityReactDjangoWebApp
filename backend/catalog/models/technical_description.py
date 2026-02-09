from django.db import models


class TechnicalDescription(models.Model):
    product_description = models.ForeignKey(
        "catalog.ProductDescription",
        on_delete=models.CASCADE,
        related_name="tech_values",
    )
    group = models.ForeignKey(
        "catalog.SpecificationGroup",
        on_delete=models.PROTECT,
        related_name="tech_values",
    )

    item = models.ForeignKey(
        "catalog.DescriptionItem",
        on_delete=models.PROTECT,
        related_name="tech_values",
    )
    value = models.CharField(max_length=10)
    unit = models.ForeignKey(
        "catalog.AppUnit",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="tech_values",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product_description", "group", "item"],
                name="uniq_product_desc_group_item",
            )
        ]
        db_table = "catalog_app_technical_description"
        verbose_name = "Technical Description"
        verbose_name_plural = "Technical Descriptions"

    def __str__(self) -> str:
        return f"{self.group} - {self.item}"
