from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile

MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024


def validate_image_file_size(file: UploadedFile) -> None:
    size = file.size

    if size is not None and size > MAX_IMAGE_FILE_SIZE:
        raise ValidationError("Размер изображения не должен превышать 10 МБ.")
