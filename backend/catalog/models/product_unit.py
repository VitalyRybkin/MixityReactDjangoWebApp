from typing import Any

from django.core.exceptions import ValidationError
from django.db import models


class ProductUnit(models.Model):
    """
    Represents a configurable unit for a product with specific weight constraints.

    Attributes:
        product: The product associated with this unit configuration.
        unit: The unit of measure restricted to "piece" type for this configuration.
        kg_per_unit: The weight of the unit in kilograms, constrained to specific values.
    """

    ALLOWED_BAG_WEIGHTS = {15, 20, 25, 30}

    product = models.OneToOneField(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="piece_config",
    )
    unit = models.ForeignKey(
        "catalog.AppUnit",
        on_delete=models.PROTECT,
        limit_choices_to={"title": "piece"},
    )
    kg_per_unit = models.PositiveSmallIntegerField()

    class Meta:
        db_table = "catalog_product_units"
        constraints = [
            models.CheckConstraint(
                check=models.Q(kg_per_unit__in=[15, 20, 25, 30]),
                name="chk_piece_kg_allowed",
            )
        ]

    def clean(self) -> None:
        """
        Validates the attributes of the object to ensure they meet specific conditions.

        Ensures the `unit.title` attribute is set to "piece" and validates that
        the `kg_per_unit` attribute corresponds to an allowed bag weight. If any
        of the conditions are violated, a `ValidationError` is raised.

        Raises:
            ValidationError: If the `unit.title` is not "piece" or if
            `kg_per_unit` is not in the allowed bag weights.
        """
        if self.unit.title != "piece":
            raise ValidationError({"unit": "ProductUnit is only for 'piece'."})

        if self.kg_per_unit not in self.ALLOWED_BAG_WEIGHTS:
            raise ValidationError(
                {
                    "kg_per_unit": f"Bag weight must be one of {sorted(self.ALLOWED_BAG_WEIGHTS)} kg"
                }
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.product} ({self.unit}) - {self.kg_per_unit} kg"
