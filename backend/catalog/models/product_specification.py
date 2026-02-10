from django.db import models


class ProductSpecification(models.Model):
    """
    Represents a product specification within the catalog system.

    Associates specific details or characteristics (specifications)
    with a product. Organizes these specifications by groups and optionally
    associates them with a unit.

    Attributes:
        product: The product for which the specification applies.
        group: The group to which this specification belongs.
        value: The value associated with the specification.
        unit: The unit of measurement for the specification value, if applicable.

    Meta:
        constraints: Enforces uniqueness of the combination of product and group.
    """

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="spec_items",
    )
    group = models.ForeignKey(
        "catalog.SpecificationGroup",
        on_delete=models.PROTECT,
        related_name="spec_items",
    )
    value = models.CharField(max_length=10)
    unit = models.ForeignKey(
        "catalog.AppUnit",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="spec_items",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "group"],
                name="uniq_product_spec_group",
            )
        ]
        db_table = "catalog_specification"
        verbose_name = "Product Specification"
        verbose_name_plural = "Product Specifications"

    def __str__(self) -> str:
        return f"{self.group}"
