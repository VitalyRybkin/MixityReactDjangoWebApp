from django.db import models


class Organisation(models.Model):
    """
    Represents an organization with basic information.
    """
    short_name = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    inn = models.CharField(max_length=10)
    kpp = models.CharField(max_length=9)
    ceo_name = models.CharField(max_length=255)

    def __str__(self):
        return self.short_name

class Documentation(models.Model):
    """
    Represents a document associated with an organization.
    """
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="docs")