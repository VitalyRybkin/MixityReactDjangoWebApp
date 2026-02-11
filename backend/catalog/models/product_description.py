from django.db import models


class ProductDescription(models.Model):
    """
    Represents a product description as a model.

    Stores the relationship between a product and its description items,
    including an actual description text. Enforces unique constraints to ensure
    there is only one entry for a specific combination of product and description
    item. Suitable for linking multiple descriptions or details to a catalog
    product efficiently.

    Attributes:
        product: A ForeignKey linking this model to the "catalog.Product" model.
            Identifies the product to which the description is related.
        item: A ForeignKey linking this model to the
            "catalog.DescriptionItem" model. Identifies the description item for
            the product.
        text: A TextField holding the specific description details.

    Meta:
        constraints: List of unique constraints to ensure uniqueness of the
            product-description item combination.
    """

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="descriptions",
    )
    item = models.ForeignKey(
        "catalog.DescriptionItem",
        on_delete=models.PROTECT,
        related_name="product_descriptions",
    )
    text = models.TextField()
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "item"],
                name="uniq_product_description",
            )
        ]
        db_table = "catalog_product_description"
        verbose_name = "Product Description"
        verbose_name_plural = "Product Descriptions"

    def __str__(self) -> str:
        return f"{self.product} - {self.item}"
