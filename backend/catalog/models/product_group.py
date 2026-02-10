from django.db import models


class ProductGroup(models.Model):
    """
    Represents a group of products.

    Defines a grouping of products, allowing for organization and categorization
    of products within the catalog. Each group is tied to a specific product and identified
    by a unique name within the context of that product.

    Attributes:
        name: The name of the product group. Must be unique for a specific product.
        product: A reference to the associated product. If the product is deleted, the
                 corresponding product group is also removed.

    Meta:
        - `constraints`: Ensures that each combination of product and name is unique.
    """

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
        db_table = "catalog_product_group"
        verbose_name = "Product Group"
        verbose_name_plural = "Product Groups"

    def __str__(self) -> str:
        return self.name
