from django.db import models


class OrderDelivery(models.Model):
    order = models.OneToOneField(
        "order.Order",
        on_delete=models.CASCADE,
        related_name="delivery",
    )
    delivery_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Стоимость доставки",
    )
    delivery_compensation = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Оплата за доставку",
    )
    demurrage = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Простой на выгрузке",
    )
    carrier = models.ForeignKey(
        "logistic.Carrier",
        on_delete=models.SET_NULL,
        null=True,
        related_name="deliveries",
    )
    driver = models.ForeignKey(
        "logistic.Driver",
        on_delete=models.SET_NULL,
        null=True,
        related_name="deliveries",
    )
    truck = models.ForeignKey(
        "logistic.Truck",
        on_delete=models.SET_NULL,
        null=True,
        related_name="deliveries",
    )

    class Meta:
        verbose_name = "Данные доставки"
        verbose_name_plural = "Данные доставок"
        ordering = ["-order"]
        db_table = "order_delivery"
        indexes = [models.Index(fields=["order"])]
