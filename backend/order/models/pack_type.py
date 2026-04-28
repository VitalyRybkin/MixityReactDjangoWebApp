from django.db import models


class PackType(models.Model):
    name = models.CharField(max_length=64)
    full_name = models.CharField(max_length=128, null=True, blank=True)

    class Meta:
        verbose_name = "Упаковка"
        verbose_name_plural = "Упаковка"

    def __str__(self) -> str:
        return self.name
