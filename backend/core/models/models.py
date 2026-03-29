from django.core.exceptions import ValidationError
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

    class Meta:
        verbose_name = "Организация"
        verbose_name_plural = "Организации"

    def __str__(self) -> str:
        return self.short_name

class Documentation(models.Model):
    """
    Represents a document associated with an organization.
    """

    ALLOWED_TAGS = ("МИКСИТИ", "РИКС", "ОБЩИЕ")

    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="docs")
    status = models.CharField(max_length=25,blank=True, null=True)
    tag = models.CharField(max_length=255, choices=[(tag, tag) for tag in ALLOWED_TAGS], default=ALLOWED_TAGS[0],)

    class Meta:
        verbose_name = "Документ"
        verbose_name_plural = "Документы"

    def clean(self) -> None:
        """
        Validates if the 'tag' attribute is part of the allowed tags. If not, raises a
        ValidationError listing the permitted tags.

        :raises ValidationError: If the 'tag' is not in the allowed tags.
        :return: None
        """
        super().clean()

        if self.tag not in self.ALLOWED_TAGS:
            allowed_str = ", ".join(sorted(self.ALLOWED_TAGS))
            raise ValidationError(
                {
                    "tag": f"Тег должен быть одним из следующих: {allowed_str}."
                }
            )

    def __str__(self) -> str:
        return self.title