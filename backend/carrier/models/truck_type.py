from django.db import models


class TruckType(models.Model):
    """
    Represents a TruckType model in the system.

    Model is used to store information about truck types, their description.
    It serves as a representation of vehicle types used for transportation purposes in the system.

    :ivar truck_type: The type of the truck type.
    :type truck_type: CharField
    :ivar description: Optional description providing additional details about the truck type.
    :type description: TextField
    """

    truck_type = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["truck_type"])]

    def __str__(self) -> str:
        return f"Тип ТС: {self.truck_type}"
