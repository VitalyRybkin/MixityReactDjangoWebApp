from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile

MAX_DOCUMENTATION_FILE_SIZE = 20 * 1024 * 1024


def validate_documentation_file_size(file: UploadedFile) -> None:
    size = file.size

    if size is not None and size > MAX_DOCUMENTATION_FILE_SIZE:
        raise ValidationError("Размер файла не должен превышать 20 МБ.")
