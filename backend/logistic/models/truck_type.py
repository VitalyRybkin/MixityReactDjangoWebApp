from django.db import models


class TruckType(models.Model):
    """
    Represents a TruckType model in the system.

    Model is used to store information about truck types, their description.
    It serves as a representation of vehicle types used for transportation purposes in the system.

    :ivar name: The type of the truck type.
    :type name: CharField
    :ivar description: Optional description providing additional details about the truck type.
    :type description: TextField
    """

    name = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["name"])]
        verbose_name = "Truck Type"
        verbose_name_plural = "Truck Types"

    def __str__(self) -> str:
        return f"Тип ТС - {self.name}"
