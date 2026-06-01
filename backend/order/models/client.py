from django.db import models

from core.models.active_mixin import ActiveMixin
from core.models.contact_info_mixin import ContactDetailsMixin


class Client(ContactDetailsMixin, ActiveMixin):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        app_label = "order"
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"

    def __str__(self) -> str:
        return f"Клиент: {self.name}"
