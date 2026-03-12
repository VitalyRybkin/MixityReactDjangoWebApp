from django.core.validators import RegexValidator
from django.db import models

plate_regex = RegexValidator(
    regex=r"^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$",
    message="Формат: А123ВС77",
)


class Truck(models.Model):
    """
    Encapsulates the details of a truck, including its type,
    capacity, license plate, and optional description. It is associated with a carrier
    and represents a key element in the logistics management system.

    Attributes:
        carrier (ForeignKey): A reference to the Carrier model that owns this truck.
        truck_type (ForeignKey): A reference to the TruckType model that specifies the
            type of the truck.
        capacity (ForeignKey): A reference to the TruckCapacity model that defines the
            truck's load capacity.
        license_plate (CharField): The unique license plate identifier for the truck,
            validated and indexed for efficient lookup. Example: 'А123ВС77'.
        description (TextField): An optional textual description of the truck.
    """

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
        max_length=9,
        unique=True,
        db_index=True,
        validators=[plate_regex],
        help_text="Например: А123ВС77",
    )

    description = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.license_plate} ({self.truck_type})"
