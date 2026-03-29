from django.db import models

from core.models.active_mixin import ActiveMixin
from core.models.contact_info_mixin import ContactDetailsMixin


class ActiveQuerySet(models.QuerySet):
    def active(self) -> "ActiveQuerySet":
        return self.filter(is_active=True)


class Carrier(ContactDetailsMixin, ActiveMixin):
    """
    Represents a carrier, typically a transportation company.

    Contains information about a carrier, including its name and a
    description of its services. It is used to manage carrier data in a database
    and provides a string representation of the carrier for display purposes.

    Attributes:
        name (str): The name of the carrier.
        organization (str, optional): The full name of the carrier. This field is optional.
        address (str, optional): The address of the carrier's headquarters. This field is optional.
        description (str, optional): A description of the carrier, its services, or any
            additional relevant information. This field is optional and can
            be left blank.
        phone (str, optional): The phone number of the carrier. This field is optional.
        email (str, optional): The email address of the carrier. This field is optional.
    """

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["is_active", "name"])]
        verbose_name = "Перевозчик"
        verbose_name_plural = "Перевозчики"

    def __str__(self) -> str:
        return f"TK: {self.name}"
