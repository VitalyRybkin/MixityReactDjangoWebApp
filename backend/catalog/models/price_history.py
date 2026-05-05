from django.db import models
from django.db.models import OuterRef, QuerySet, Subquery
from django.utils import timezone


class SalesPriceHistoryManager(models.Manager):
    def latest_prices_for_customer_products(
        self,
        *,
        customer_id: int,
        product_ids: list[int],
    ) -> QuerySet:
        if not product_ids:
            return self.none()

        latest_ids = (
            self.filter(
                customer_id=customer_id,
                product_id=OuterRef("product_id"),
            )
            .order_by("-date", "-id")
            .values("id")[:1]
        )

        return (
            self.filter(
                customer_id=customer_id,
                product_id__in=product_ids,
                id__in=Subquery(latest_ids),
            )
            .select_related("product", "customer")
            .order_by("product_id")
        )


class PurchasePriceHistoryManager(models.Manager):
    def latest_prices_for_warehouse_products(
        self,
        *,
        warehouse_id: int,
        product_ids: list[int],
    ) -> QuerySet:
        if not product_ids:
            return self.none()

        latest_ids = (
            self.filter(
                warehouse_id=warehouse_id,
                product_id=OuterRef("product_id"),
            )
            .order_by("-date", "-id")
            .values("id")[:1]
        )

        return (
            self.filter(
                warehouse_id=warehouse_id,
                product_id__in=product_ids,
                id__in=Subquery(latest_ids),
            )
            .select_related("product", "warehouse")
            .order_by("product_id")
        )


class PurchasePriceHistory(models.Model):
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
    """

    date = models.DateField(default=timezone.now)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="purchase_price_history",
    )
    warehouse = models.ForeignKey(
        "stock.Warehouse", on_delete=models.CASCADE, related_name="warehouse_prices"
    )
    objects = PurchasePriceHistoryManager()

    class Meta:
        ordering = ["-date"]
        db_table = "catalog_purchase_price_history"
        verbose_name = "История цены закупки"
        verbose_name_plural = "История цен закупки"
        unique_together = ("product", "warehouse", "date")
        get_latest_by = "date"

    def __str__(self) -> str:
        return f"{self.product.name} - {self.warehouse.name} - {self.date}"


class SalesPriceHistory(models.Model):
    """
    Represents the historical record of sales prices for specific products and customers.

    Attributes:
        date (DateField): The date associated with the sales price record. Defaults to the current date.
        sale_price (DecimalField): The sales price of the product, stored with precision of up to 10 digits
            and 2 decimal places.
        product (ForeignKey): The foreign key relationship to the "catalog.Product" model. This represents
            the product associated with the sales price record.
        customer (ForeignKey): The foreign key relationship to the "order.Customer" model. This represents
            the customer associated with the sales price record.
        objects (Manager): The default manager for handling model queries.
    """

    date = models.DateField(default=timezone.now)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="sales_price_history",
    )
    customer = models.ForeignKey(
        "order.Customer",
        on_delete=models.CASCADE,
        related_name="customer_prices",
    )
    objects = SalesPriceHistoryManager()

    class Meta:
        ordering = ["-date"]
        db_table = "catalog_sales_price_history"
        verbose_name = "История цены реализации"
        verbose_name_plural = "История цен реализации"
        unique_together = ("product", "customer", "date")

    def __str__(self) -> str:
        return f"{self.product.name} - {self.customer.name} - {self.date}"
