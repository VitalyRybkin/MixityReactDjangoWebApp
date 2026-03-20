from django.db import models


class TruckCapacity(models.Model):
    """
    Represents a TruckCapacity model in the system.

    This model is used to store information about truck capacities, their description.
    It serves as a representation of vehicle capacities used for transportation purposes in the system.

    Attributes:
        capacity (DecimalField): The capacity of the truck.
        description (TextField): Optional description providing additional details about the truck capacity.
    """

    capacity = models.DecimalField(max_digits=4, decimal_places=1)
    description = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["capacity"])]
        verbose_name = "Грузоподъемность"
        verbose_name_plural = "Грузоподъемность"

    def __str__(self) -> str:
        return f"Грузоподъемность - {self.capacity} т"
