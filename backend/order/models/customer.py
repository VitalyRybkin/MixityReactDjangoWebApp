from django.db import models

from core.models.active_mixin import ActiveMixin
from core.models.contact_info_mixin import ContactDetailsMixin


class Customer(ContactDetailsMixin, ActiveMixin):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        app_label = "order"
        verbose_name = "Заказчик"
        verbose_name_plural = "Заказчики"

    def __str__(self) -> str:
        return f"Заказчик: {self.name}"
