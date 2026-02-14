from django.db import models


class DescriptionItem(models.Model):
    """
    Represents a Description Item in the catalog.

    Defines a description item with a title. Provides a clear structure for interacting
    with catalog description-related data in the database. Uses a custom database table name and includes metadata
    for specifying singular and plural verbose names. The string representation of
    the model instance returns its title.

    Attributes:
        title (str): The title of the description item.
        order (int): The order of the description item within its category.
    """

    title = models.CharField(max_length=255)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("order",)
        db_table = "catalog_description_item"
        verbose_name = "Description Item"
        verbose_name_plural = "Description Items"

    def __str__(self) -> str:
        return self.title
