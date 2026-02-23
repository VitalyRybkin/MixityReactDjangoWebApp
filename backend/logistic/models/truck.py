from typing import Any

from django.core.validators import RegexValidator
from django.db import models


class Truck(models.Model):
    """
    Represents a Truck model in the system.

    Used to store information about trucks, their type, capacity,
    and associated carriers. It serves as a representation of vehicles used
    for transportation purposes in the system.

    Attributes:
        carrier (ForeignKey): The carrier associated with this truck.
        truck_type (ForeignKey): The type of the truck.
        capacity (ForeignKey): The capacity of the truck.
        license_plate (CharField): The license plate number of the truck.
        description (TextField): Optional description providing additional details about the truck.
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

    truck_type = models.ForeignKey(
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
        return f"Авто: {self.truck_type}, {self.capacity}, {self.carrier}"
