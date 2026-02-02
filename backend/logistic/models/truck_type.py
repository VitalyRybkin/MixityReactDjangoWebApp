from django.db import models
from rest_framework.reverse import reverse


class TruckType(models.Model):
    """
    Represents a TruckType model in the system.

    Model is used to store information about truck types, their description.
    It serves as a representation of vehicle types used for transportation purposes in the system.

    :ivar type: The type of the truck type.
    :type type: CharField
    :ivar description: Optional description providing additional details about the truck type.
    :type description: TextField
    """

    type = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["type"])]
        verbose_name = "Truck Type"
        verbose_name_plural = "Truck Types"

    def get_absolute_url(self) -> str:
        return reverse("truck_types_details", kwargs={"pk": self.pk})

    def __str__(self) -> str:
        return f"Тип ТС - {self.type}"
