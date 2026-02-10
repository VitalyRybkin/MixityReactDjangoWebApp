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
        description_item: A ForeignKey linking this model to the
            "catalog.DescriptionItem" model. Identifies the description item for
            the product.
        description: A TextField holding the specific description details.

    Meta:
        constraints: List of unique constraints to ensure uniqueness of the
            product-description item combination.
    """

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

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "description_item"],
                name="uniq_product_description",
            )
        ]
        db_table = "catalog_product_description"
        verbose_name = "Product Description"
        verbose_name_plural = "Product Descriptions"

    def __str__(self) -> str:
        return f"{self.product} - {self.description_item}"
