from django.db import models

from core.models import ActiveMixin


class ConstructionObject(ActiveMixin):
    customer = models.ForeignKey(
        "order.Customer",
        on_delete=models.CASCADE,
        related_name="customer_objects",
    )
    name = models.CharField(max_length=128)
    address = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        app_label = "order"
        verbose_name = "Объект"
        verbose_name_plural = "Объекты"
        indexes = [
            models.Index(fields=["customer"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self) -> str:
        return self.name
