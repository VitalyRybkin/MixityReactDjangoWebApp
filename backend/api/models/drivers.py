from django.db import models


class Driver(models.Model):
    """
    Represents a driver entity related to a carrier entity.

    Class is used to define a driver model, storing information about drivers
    and their association with a carrier. Each driver belongs to a specific carrier.

    :ivar carrier: The carrier associated with this driver.
    :type carrier: ForeignKey
    :ivar driver_name: The name of the driver.
    :type driver_name: CharField
    """

    carrier = models.ForeignKey(
        "Carrier", on_delete=models.CASCADE, related_name="drivers"
    )
    driver_name = models.CharField(max_length=100)

    def __str__(self):
        return f"ВОДИТЕЛЬ: {self.driver_name}"
