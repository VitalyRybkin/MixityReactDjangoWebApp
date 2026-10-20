from io import BytesIO
import subprocess
import tempfile
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile, UploadedFile
from PIL import Image, ImageOps, UnidentifiedImageError

from django.core.exceptions import ValidationError
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from rest_framework import serializers

from core.api.exceptions import AntivirusUnavailableError
from core.security.clamav import (
    ClamAVUnavailableError,
    MalwareDetectedError,
    scan_file_for_malware,
)


MAX_INCOMING_FILE_SIZE_MB = 10
MAX_INCOMING_FILE_SIZE = MAX_INCOMING_FILE_SIZE_MB * 1024 * 1024

MAX_STORED_FILE_SIZE_KB = 500
MAX_STORED_FILE_SIZE = MAX_STORED_FILE_SIZE_KB * 1024


def validate_file_size(file: UploadedFile | None) -> None:
    """
    Validates the size of an uploaded file to ensure it meets predefined constraints. If no
    file is provided, the function exits without performing any validation. File size is
    checked to confirm it is not undefined, and then validated to ensure it does not exceed
    a maximum allowable limit. If any validation fails, a `ValidationError` is raised with
    an appropriate error message.
    """
    if file is None:
        return

    if file.size is None:
        raise ValidationError(
            "Не удалось определить размер файла."
        )

    if file.size > MAX_INCOMING_FILE_SIZE:
        raise ValidationError(
            f"Размер исходного файла не должен превышать "
            f"{MAX_INCOMING_FILE_SIZE_MB} МБ."
        )


def scan_uploaded_file(file: UploadedFile | None) -> None:
    """
    Scans an uploaded file for malware using an antivirus solution. This function
    aims to ensure that files being processed by the system are safe and do not
    contain potentially harmful content. It automatically handles specific
    antivirus-related exceptions and resets the file pointer upon completion.
    """
    if file is None:
        return

    try:
        file.seek(0)
        scan_file_for_malware(file)

    except MalwareDetectedError as exc:
        raise serializers.ValidationError(
            "Файл не прошёл антивирусную проверку."
        ) from exc

    except ClamAVUnavailableError as exc:
        raise AntivirusUnavailableError() from exc

    finally:
        file.seek(0)

def compress_jpeg(file: UploadedFile) -> UploadedFile:
    try:
        file.seek(0)

        with Image.open(file) as opened_image:
            if opened_image.format != "JPEG":
                raise serializers.ValidationError(
                    "Файл не является JPEG-изображением."
                )

            opened_image.load()

            image: Image.Image = ImageOps.exif_transpose(opened_image)

            if image.mode != "RGB":
                image = image.convert("RGB")

            if file.size is not None and file.size <= MAX_STORED_FILE_SIZE:
                file.seek(0)
                return file

            max_dimension = 2000

            if max(image.size) > max_dimension:
                image.thumbnail(
                    (max_dimension, max_dimension),
                    Image.Resampling.LANCZOS,
                )

            file_name = file.name or "upload.jpeg"

            for quality in (85, 80, 75, 70, 65, 60, 55, 50):
                output = BytesIO()

                image.save(
                    output,
                    format="JPEG",
                    quality=quality,
                    optimize=True,
                )

                if output.tell() <= MAX_STORED_FILE_SIZE:
                    return SimpleUploadedFile(
                        name=f"{Path(file_name).stem}.jpg",
                        content=output.getvalue(),
                        content_type="image/jpeg",
                    )

            raise serializers.ValidationError(
                f"Не удалось уменьшить изображение до "
                f"{MAX_STORED_FILE_SIZE_KB} КБ."
            )

    except (UnidentifiedImageError, OSError) as exc:
        raise serializers.ValidationError(
            "Некорректное или повреждённое изображение."
        ) from exc

    finally:
        file.seek(0)

def validate_pdf(
    file: UploadedFile | None,
    pdf_only: bool = False,
) -> UploadedFile | None:
    """
    Validates the integrity and compatibility of an uploaded file to ensure it meets
    specific criteria, primarily for PDF file validation. Handles different scenarios
    where the file might not adhere to expected formats or conditions.
    """
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

    finally:
        file.seek(0)

    return file

def compress_pdf(file: UploadedFile) -> UploadedFile:
    if file.size is not None and file.size <= MAX_STORED_FILE_SIZE:
        file.seek(0)
        return file

    file_name = file.name or "upload.pdf"

    profiles = (
        (150, 300),
        (120, 240),
        (96, 200),
    )

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            input_path = temp_path / "input.pdf"

            file.seek(0)

            with input_path.open("wb") as input_file:
                for chunk in file.chunks():
                    input_file.write(chunk)

            for image_dpi, mono_dpi in profiles:
                output_path = temp_path / f"output-{image_dpi}.pdf"

                command = [
                    "gs",
                    "-sDEVICE=pdfwrite",
                    "-dCompatibilityLevel=1.4",
                    "-dNOPAUSE",
                    "-dBATCH",
                    "-dQUIET",
                    "-dSAFER",
                    "-sColorConversionStrategy=Gray",
                    "-dProcessColorModel=/DeviceGray",
                    "-dDownsampleColorImages=true",
                    f"-dColorImageResolution={image_dpi}",
                    "-dDownsampleGrayImages=true",
                    f"-dGrayImageResolution={image_dpi}",
                    "-dDownsampleMonoImages=true",
                    f"-dMonoImageResolution={mono_dpi}",
                    f"-sOutputFile={output_path}",
                    str(input_path),
                ]

                try:
                    subprocess.run(
                        command,
                        check=True,
                        capture_output=True,
                        timeout=30,
                    )
                except subprocess.TimeoutExpired as exc:
                    raise serializers.ValidationError(
                        "Превышено время обработки PDF."
                    ) from exc
                except subprocess.CalledProcessError as exc:
                    raise serializers.ValidationError(
                        "Не удалось обработать PDF."
                    ) from exc
                except FileNotFoundError as exc:
                    raise serializers.ValidationError(
                        "Сервис обработки PDF недоступен."
                    ) from exc

                if (
                    output_path.exists()
                    and output_path.stat().st_size <= MAX_STORED_FILE_SIZE
                ):
                    return SimpleUploadedFile(
                        name=f"{Path(file_name).stem}.pdf",
                        content=output_path.read_bytes(),
                        content_type="application/pdf",
                    )

        raise serializers.ValidationError(
            f"Не удалось уменьшить PDF до "
            f"{MAX_STORED_FILE_SIZE_KB} КБ."
        )

    finally:
        file.seek(0)