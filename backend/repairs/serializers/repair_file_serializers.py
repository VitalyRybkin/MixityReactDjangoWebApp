from pathlib import Path

from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from core.validators.files import (
    compress_jpeg,
    compress_pdf,
    scan_uploaded_file,
    validate_file_size,
    validate_pdf,
)
from repairs.models.repair_request_models import ClosingFile, RepairRequest, RequestFile


def process_repair_file(
    file: UploadedFile | None,
) -> UploadedFile | None:
    if file is None:
        return None

    validate_file_size(file)
    scan_uploaded_file(file)

    file_name = file.name

    if not file_name:
        raise serializers.ValidationError("Не удалось определить имя файла.")

    suffix = Path(file_name).suffix.lower()

    if suffix == ".pdf":
        validate_pdf(file, pdf_only=True)
        return compress_pdf(file)

    if suffix in {".jpg", ".jpeg"}:
        return compress_jpeg(file)

    return file


class RepairRequestFileReadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = RequestFile
        fields = [
            "id",
            "file_name",
            "file",
        ]


class RepairRequestFileWriteSerializer(RepairRequestFileReadSerializer):
    @classmethod
    def validate_file(
        cls,
        file: UploadedFile | None,
    ) -> UploadedFile | None:
        return process_repair_file(file)


class RepairClosingFileReadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ClosingFile
        fields = [
            "id",
            "file_name",
            "file",
        ]


class RepairClosingFileWriteSerializer(RepairClosingFileReadSerializer):
    @classmethod
    def validate_file(
        cls,
        file: UploadedFile | None,
    ) -> UploadedFile | None:
        return process_repair_file(file)


class RepairFilesSerializer(serializers.ModelSerializer):
    closing_files = RepairClosingFileReadSerializer(
        many=True,
        read_only=True,
    )
    request_files = RepairRequestFileReadSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = RepairRequest
        fields = [
            "request_files",
            "closing_files",
        ]
