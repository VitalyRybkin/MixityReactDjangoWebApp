from typing import Collection

from django.core.validators import FileExtensionValidator
from django.db import models

from core.validators.files import validate_image_file_size


class ImageFieldValidationContractMixin:
    def _image_field_validation_logic(
        self,
        *,
        model: type[models.Model],
        field_name: str,
        allowed_extensions: Collection[str] = ("jpg", "jpeg", "png"),
    ) -> None:
        field = model._meta.get_field(field_name)

        assert isinstance(field, models.ImageField)

        extension_validator = next(
            (
                validator
                for validator in field.validators
                if isinstance(validator, FileExtensionValidator)
            ),
            None,
        )

        assert extension_validator is not None
        assert extension_validator.allowed_extensions is not None

        assert set(extension_validator.allowed_extensions) == set(allowed_extensions)

        assert validate_image_file_size in field.validators
