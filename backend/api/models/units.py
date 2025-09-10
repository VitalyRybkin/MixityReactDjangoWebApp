from django.db import models


class AppUnit(models.Model):
    """
    Represents a unit of measurement used in the application.

    Class defines measurement units, particularly focusing on distinctions
    between weight-based and non-weight-based units. It includes attributes for
    unit names, shortcuts, and conversion factors when applicable.

    :ivar unit_name: The full name of the measurement unit.
    :type unit_name: str
    :ivar unit_shortcut: The abbreviated name of the measurement unit (e.g., 'kg').
    :type unit_shortcut: str
    :ivar is_weight_based: Indicates whether the unit is based on weight (True) or
                           not (False).
    :type is_weight_based: bool
    :ivar to_kg_factor: The numeric factor needed to convert this unit to
                        kilograms, applicable only if the unit is weight-based.
                        For non-weight-based units, it defaults to 1.
    :type to_kg_factor: Decimal
    """

    unit_name = models.CharField(max_length=20, unique=True)
    unit_shortcut = models.CharField(max_length=3, unique=True)
    is_weight_based = models.BooleanField(default=True)

    to_kg_factor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Conversion factor to kilograms (if weight-based). For non-weight units, leave as 1.",
    )

    class Meta:
        db_table = "orders_app_units"

    def __str__(self):
        return f"ЕДИНИЦА ИЗМЕРЕНИЯ: {self.unit_name}"
