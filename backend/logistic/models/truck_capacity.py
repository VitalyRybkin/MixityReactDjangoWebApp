from django.db import models


class TruckCapacity(models.Model):
    """
    Represents a TruckCapacity model in the system.

    This model is used to store information about truck capacities, their description.
    It serves as a representation of vehicle capacities used for transportation purposes in the system.

    :ivar capacity: The capacity of the truck capacity.
    :type capacity: DecimalField
    :ivar description: Optional description providing additional details about the truck capacity.
    :type description: TextField
    """

    capacity = models.DecimalField(max_digits=2, decimal_places=1)
    description = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["capacity"])]
        verbose_name = 'Truck Capacity'
        verbose_name_plural = 'Truck Capacities'

    def __str__(self) -> str:
        return f"Грузоподъемность - {self.capacity} т"
