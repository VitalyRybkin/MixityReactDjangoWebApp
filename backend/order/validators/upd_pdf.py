from django.core.files.uploadedfile import UploadedFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from rest_framework import serializers

from core.api.exceptions import AntivirusUnavailableError
from core.security.clamav import (
    ClamAVUnavailableError,
    MalwareDetectedError,
    scan_file_for_malware,
)


MAX_UPD_PDF_SIZE = 10 * 1024 * 1024


def validate_upd_pdf(
    file: UploadedFile | None,
) -> UploadedFile | None:
    if file is None:
        return None

    if file.size is None:
        raise serializers.ValidationError(
            "Не удалось определить размер PDF."
        )

    if file.size > MAX_UPD_PDF_SIZE:
        raise serializers.ValidationError(
            "Размер PDF не должен превышать 10 МБ."
        )

    try:
        file.seek(0)

        if file.read(5) != b"%PDF-":
            raise serializers.ValidationError(
                "Файл не является PDF."
            )

        file.seek(0)

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