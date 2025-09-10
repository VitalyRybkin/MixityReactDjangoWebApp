from django.db import models


class TruckCapacity(models.Model):
    """
    Represents a TruckCapacity model in the system.

    This model is used to store information about truck capacities, their description.
    It serves as a representation of vehicle capacities used for transportation purposes in the system.

    :ivar truck_capacity: The capacity of the truck capacity.
    :type truck_capacity: SmallIntegerField
    :ivar description: Optional description providing additional details about the truck capacity.
    :type description: TextField
    """

    class Meta:
        db_table = "orders_app_truck_capacities"

    truck_capacity = models.SmallIntegerField()
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"ГРУЗОПОДЪЕМНОСТЬ: {self.truck_capacity} тонн"
