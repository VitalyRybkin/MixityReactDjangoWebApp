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

    class Meta:
        db_table = "orders_app_truck_types"

    truck_type = models.CharField(max_length=20)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"ТИП ТС: {self.truck_type}"
