from django.db import models


class TruckCapacity(models.Model):
    """
    Represents a TruckCapacity model in the system.

    This model is used to store information about truck capacities, their description.
    It serves as a representation of vehicle capacities used for transportation purposes in the system.

    :ivar capacity: The capacity of the truck capacity.
    :type capacity: SmallIntegerField
    :ivar description: Optional description providing additional details about the truck capacity.
    :type description: TextField
    """

    capacity = models.SmallIntegerField(unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["capacity"])]

    def __str__(self) -> str:
        return f"Грузоподъемность: {self.capacity} тонн"
