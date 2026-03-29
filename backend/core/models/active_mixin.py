from django.db import models

from core.common.querysets import ActiveQuerySet


class ActiveMixin(models.Model):
    is_active = models.BooleanField(default=True)

    objects = ActiveQuerySet.as_manager()
    all_objects = models.Manager()

    class Meta:
        abstract = True