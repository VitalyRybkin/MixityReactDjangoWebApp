from django.db import models


class PackType(models.Model):
    name = models.CharField(max_length=64)
    full_name = models.CharField(max_length=128)


    class Meta:
        verbose_name = 'Упаковка'
        verbose_name_plural = 'Упаковка'