from django.db import models


class ProductSpecification(models.Model):
    """
    Represents a product specification within the catalog system.

    Associates specific details or characteristics (specifications)
    with a product. Organizes these specifications by groups and optionally
    associates them with a unit.

    Attributes:
        product: The product for which the specification applies.
        name: The name of the specification.
        value: The value associated with the specification.
        unit: The unit of measurement for the specification value, if applicable.

    Meta:
        constraints: Enforces uniqueness of the combination of product and group.
    """

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="specs",
    )
    name = models.ForeignKey(
        "catalog.ProductSpecName",
        on_delete=models.PROTECT,
        related_name="spec_names",
    )
    value = models.CharField(max_length=128)
    unit = models.ForeignKey(
        "catalog.AppUnit",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
    )

    class Meta:
        ordering = ("name__group__order", "name__order", "pk")
        indexes = [models.Index(fields=("product",))]
        constraints = [
            models.UniqueConstraint(
                fields=("product", "name"),
                name="uniq_product_spec_row",
            )
        ]
        db_table = "catalog_specification"
        verbose_name = "Product Specification"
        verbose_name_plural = "Product Specifications"

    def __str__(self) -> str:
        return f"{self.name} ({self.product.name})"
