from django.db import models


class ProductSpecName(models.Model):
    title = models.CharField(max_length=255)
    group = models.ForeignKey(
        "catalog.SpecificationGroup",
        on_delete=models.PROTECT,
    )
    order = models.PositiveIntegerField()

    to_web = models.BooleanField(
        default=True,
    )
    to_passport = models.BooleanField(
        default=False,
    )

    class Meta:
        ordering = (
            "group__order",
            "order",
        )
        db_table = "catalog_product_spec_name"
        verbose_name = "Наименование показателя спецификации"
        verbose_name_plural = "Наименования показателей спецификации"

    def __str__(self) -> str:
        return self.title
