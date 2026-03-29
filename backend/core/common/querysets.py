from django.db import models
from django.db.models import QuerySet


class ActiveQuerySet(models.QuerySet):
    def active(self) -> QuerySet:
        return self.filter(is_active=True)