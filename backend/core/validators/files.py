from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from rest_framework import serializers

from core.api.exceptions import AntivirusUnavailableError
from core.security.clamav import scan_file_for_malware, MalwareDetectedError, ClamAVUnavailableError

MAX_SIZE = 1
MAX_UPLOAD_SIZE = MAX_SIZE * 1024 * 1024


def validate_file_size(file: UploadedFile | None) -> None:
    if file is None:
        return None

    size = file.size

    if size is not None and size > MAX_UPLOAD_SIZE:
        raise ValidationError(f"Размер изображения не должен превышать {MAX_SIZE} МБ.")
    return None


def validate_pdf(
    file: UploadedFile | None,
    pdf_only: bool = False,
) -> UploadedFile | None:
    if file is None:
        return None

    try:
        file.seek(0)
        header = file.read(5)
        file.seek(0)

        is_pdf = header == b"%PDF-"

        if pdf_only and not is_pdf:
            raise serializers.ValidationError(
                "Файл не является PDF."
            )

        if is_pdf:
            try:
                reader = PdfReader(file, strict=True)
            except (
                PdfReadError,
                EOFError,
                ValueError,
                TypeError,
            ) as exc:
                raise serializers.ValidationError(
                    "Некорректный или повреждённый PDF."
                ) from exc

            if reader.is_encrypted:
                raise serializers.ValidationError(
                    "Зашифрованные PDF-файлы не поддерживаются."
                )

            if len(reader.pages) == 0:
                raise serializers.ValidationError(
                    "PDF не содержит страниц."
                )

            try:
                scan_file_for_malware(file)
            except MalwareDetectedError as exc:
                raise serializers.ValidationError(
                    "Файл не прошёл антивирусную проверку."
                ) from exc
            except ClamAVUnavailableError as exc:
                raise AntivirusUnavailableError() from exc

    finally:
        file.seek(0)

    return file