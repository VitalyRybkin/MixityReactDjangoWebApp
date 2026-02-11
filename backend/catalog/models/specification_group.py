from django.db import models


class SpecificationGroup(models.Model):
    """
    Represents a group of specifications in the catalog.

    Defines a group that encompasses specifications. Organizes and manages attributes or specifications
    of catalog items. Includes a name for the group and metadata for database representation
    and administrative purposes.

    Attributes:
        name: CharField
            The name of the specification group.
        order: PositiveSmallIntegerField
            The order of the specification group within the catalog.
    """

    name = models.CharField(max_length=255)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "catalog_specification_group"
        verbose_name = "Specification Group"
        verbose_name_plural = "Specification Groups"

    def __str__(self) -> str:
        return self.name
