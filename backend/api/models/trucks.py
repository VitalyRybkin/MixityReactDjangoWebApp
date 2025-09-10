from django.db import models


class Truck(models.Model):
    """
    Represents a Truck model in the system.

    This model is used to store information about trucks, their type, capacity,
    and associated carrier. It serves as a representation of vehicles used
    for transportation purposes in the system.

    :ivar truck_type: The type of the truck, linked to the TruckType model.
    :type truck_type: ForeignKey
    :ivar truck_capacity: The capacity of the truck, linked to the TruckCapacity model.
    :type truck_capacity: ForeignKey
    :ivar description: Optional description providing additional details about the truck.
    :type description: TextField
    :ivar carrier: The carrier associated with the truck, linked to the Carrier model.
    :type carrier: ForeignKey
    """

    truck_type = models.ForeignKey(
        "TruckType",
        on_delete=models.CASCADE,
        related_name="trucks",
    )
    truck_capacity = models.ForeignKey(
        "TruckCapacity",
        on_delete=models.CASCADE,
        related_name="trucks",
    )
    description = models.TextField(null=True, blank=True)
    carrier = models.ForeignKey(
        "Carrier",
        on_delete=models.CASCADE,
        related_name="trucks",
    )

    def __str__(self):
        return f"АВТО: тип - {self.truck_type}, тоннаж - {self.truck_capacity}, ТК - {self.carrier}"
