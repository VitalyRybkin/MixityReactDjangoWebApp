from django.db import models


class DescriptionItem(models.Model):
    title = models.CharField(max_length=255)

    class Meta:
        db_table = "descriptions_app_description_item"
        verbose_name = "Description Item"
        verbose_name_plural = "Description Items"

    def __str__(self) -> str:
        return self.title
