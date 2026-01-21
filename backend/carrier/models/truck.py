from typing import Any

from django.core.validators import RegexValidator
from django.db import models


class Truck(models.Model):
    """
    Represents a Truck model in the system.

    Used to store information about trucks, their type, capacity,
    and associated carriers. It serves as a representation of vehicles used
    for transportation purposes in the system.

    :ivar type: The type of the truck, linked to the TruckType model.
    :type type: ForeignKey
    :ivar capacity: The capacity of the truck, linked to the TruckCapacity model.
    :type capacity: ForeignKey
    :ivar description: Optional description providing additional details about the truck.
    :type description: TextField
    :ivar carrier: The carrier associated with the truck, linked to the Carrier model.
    :type carrier: ForeignKey
    """

    plate_regex = RegexValidator(
        regex=r"^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$",
        message="Format: A123BC77 (Use Cyrillic characters А, В, Е, К, М, Н, О, Р, С, Т, У, Х)",
    )

    carrier = models.ForeignKey(
        "carrier.Carrier",
        on_delete=models.CASCADE,
        related_name="trucks",
    )

    type = models.ForeignKey(
        "carrier.TruckType",
        on_delete=models.CASCADE,
        related_name="trucks",
    )

    capacity = models.ForeignKey(
        "carrier.TruckCapacity",
        on_delete=models.CASCADE,
        related_name="trucks",
    )

    license_plate = models.CharField(
        validators=[plate_regex],
        max_length=9,
        unique=True,
        db_index=True,
        help_text="Standard Russian license plate (Cyrillic)",
    )

    description = models.TextField(null=True, blank=True)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.license_plate:
            self.license_plate = (
                self.license_plate.upper().replace(" ", "").replace("-", "")
            )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return (
            f"АВТО: тип - {self.type}, тоннаж - {self.capacity} т, ТК - {self.carrier}"
        )
