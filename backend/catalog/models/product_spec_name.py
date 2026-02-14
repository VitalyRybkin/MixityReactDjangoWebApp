from django.db import models


class ProductSpecName(models.Model):
    title = models.CharField(max_length=255)
    group = models.ForeignKey("catalog.SpecificationGroup", on_delete=models.PROTECT)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = (
            "group__order",
            "order",
        )
        db_table = "catalog_product_spec_name"
        verbose_name = "Product Specification Name"
        verbose_name_plural = "Product Specification Names"

    def __str__(self) -> str:
        return self.title
