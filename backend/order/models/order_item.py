from decimal import Decimal

from django.db import models


class OrderItem(models.Model):
    order = models.ForeignKey(
        "order.Order",
        on_delete=models.CASCADE,
        related_name="order_items",
    )

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="order_entries",
    )

    pack_type = models.ForeignKey(
        "order.PackType",
        on_delete=models.SET_NULL,
        null=True,
        related_name="orders",
        blank=True,
    )

    piece_based_quantity = models.PositiveIntegerField(null=True, blank=True)

    weight_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    price_at_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    price_at_sale = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    class Meta:
        unique_together = ("order", "product")
        verbose_name = "Order Product"
        verbose_name_plural = "Order Products"
        indexes = [models.Index(fields=["order", "product"])]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(
                        piece_based_quantity__isnull=False, weight_quantity__isnull=True
                    )
                    | models.Q(
                        piece_based_quantity__isnull=True, weight_quantity__isnull=False
                    )
                ),
                name="exactly_one_quantity_type",
            )
        ]

    def get_total_price(self) -> Decimal:
        if not self.price_at_purchase:
            return Decimal("0.00")
        quantity = Decimal(self.piece_based_quantity or 0) + (
            self.weight_quantity or Decimal("0.00")
        )

        return self.price_at_purchase * quantity

    def __str__(self) -> str:
        return f"Order {self.order.id} - Product {self.product.name}"

    # def get_total_weight(self):
    #     return self.product.weight * self.weight_quantity
