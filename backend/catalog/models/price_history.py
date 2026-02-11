from django.db import models


class PriceHistory(models.Model):
    """
    Represents a historical record of product prices with associated product and warehouse information.

    Used to store and manage data about price changes of a product
    in a specific warehouse on a particular date. Linked to both Product and Warehouse
    models and allows tracking the evolution of product pricing over time.

    Attributes:
        date (datetime.date): The date when the price record was created. Automatically set
            to the current date on creation.
        purchase_price (Decimal): The purchase price of the product in the specified warehouse.
        product (catalog.Product): The product to which the price history is linked.
        warehouse (catalog.Warehouse): The warehouse associated with the price record.

    Meta:
        ordering: Specifies the default ordering of query results by descending date.
        unique_together: Ensures that the combination of product, warehouse, and date
            is unique.
        get_latest_by: Specifies 'date' as the field to use when retrieving the latest record.
    """

    date = models.DateField(auto_now_add=True)
    purchase_price = models.DecimalField(max_digits=5, decimal_places=2)
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="price"
    )
    warehouse = models.ForeignKey(
        "catalog.Warehouse", on_delete=models.CASCADE, related_name="price"
    )

    class Meta:
        ordering = ["-date"]
        db_table = "catalog_price_history"
        verbose_name = "Price History"
        verbose_name_plural = "Price History"
        unique_together = ("product", "warehouse", "date")
        get_latest_by = "date"

    def __str__(self) -> str:
        return f"{self.product.name} - {self.warehouse.name} - {self.date}"
