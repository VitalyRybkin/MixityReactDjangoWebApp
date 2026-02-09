from django.db import models


class SpecificationGroup(models.Model):
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "catalog_app_specification_group"
        verbose_name = "Specification Group"
        verbose_name_plural = "Specification Groups"

    def __str__(self) -> str:
        return self.name
