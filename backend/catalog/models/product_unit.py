from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class ProductUnit(models.Model):
    """
    Represents a ProductUnit relation that defines the weight per unit for specific products
    and their corresponding units.

    Defines how a product can be measured in different unit types, and
    enforces validations for specific business rules, including allowed bag weights and
    restrictions on certain types of units. It relies on database constraints for ensuring
    uniqueness and supports custom validation logic.

    Attributes:
        ALLOWED_BAG_WEIGHTS: A set of integers representing the allowed weights
            in kilograms for units of type "piece".
        product: A foreign key linking to the catalog.Product model, representing
            the product this unit is associated with.
        units: A foreign key linking to the catalog.AppUnit model, representing
            the unit type for this product.
        kg_per_unit: An integer field representing the weight in kilograms per unit.
            Defaults to 1.

    Meta:
        constraints: Enforces the uniqueness of the combination of product and unit
            across all instances.

    Methods:
        clean:
            Validates instance data before saving, ensuring that the kg_per_unit is
            valid for units of type "piece" and restricting certain global weight-based units.

        save:
            Cleans the object data before persisting it to the database.
    """

    ALLOWED_BAG_WEIGHTS = {15, 20, 25, 30}

    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    units = models.ForeignKey("catalog.AppUnit", on_delete=models.CASCADE)

    kg_per_unit = models.SmallIntegerField(default=1)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "units"], name="uniq_product_unit"
            )
        ]
        db_table = "catalog_product_units"

    def clean(self) -> None:
        if self.units.title == "piece":
            if self.kg_per_unit not in self.ALLOWED_BAG_WEIGHTS:
                raise ValidationError(
                    {
                        "kg_per_unit": f"Bag weight must be one of {sorted(self.ALLOWED_BAG_WEIGHTS)} kg"
                    }
                )

        if self.units.title in {"kilogram", "ton", "pallet"}:
            raise ValidationError(
                {
                    "units": "Do not create ProductUnit for kilogram/ton/pallet (they are global weight-based units)."
                }
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.product} ({self.units}) - {self.kg_per_unit} kg"
