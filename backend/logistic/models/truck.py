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
        regex=r"^[ABEKMHOPCTUX]\d{3}[ABEKMHOPCTUX]{2}\d{2,3}$",
        message="Format: A123BC77 (Use Latin characters A, B, E, K, M, H, O, P, C, T, U, X)",
    )

    carrier = models.ForeignKey(
        "logistic.Carrier",
        on_delete=models.PROTECT,
        related_name="trucks",
    )

    type = models.ForeignKey(
        "logistic.TruckType",
        on_delete=models.PROTECT,
        related_name="trucks",
    )

    capacity = models.ForeignKey(
        "logistic.TruckCapacity",
        on_delete=models.PROTECT,
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

    class Meta:
        indexes = [models.Index(fields=["carrier"])]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.license_plate:
            self.license_plate = (
                self.license_plate.upper().replace(" ", "").replace("-", "")
            )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return (
            f"Авто: тип - {self.type}, тоннаж - {self.capacity} т, ТК - {self.carrier}"
        )
