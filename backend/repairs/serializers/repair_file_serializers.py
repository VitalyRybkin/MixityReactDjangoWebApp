from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from core.validators.files import validate_pdf, validate_file_size
from repairs.models.repair_request_models import RequestFile, ClosingFile, RepairRequest


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
    def validate_file(cls, file: UploadedFile | None) -> UploadedFile | None:
        file = validate_pdf(file)
        validate_file_size(file)
        return file

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
    def validate_file(cls, file: UploadedFile | None) -> UploadedFile | None:
        file = validate_pdf(file)
        validate_file_size(file)
        return file


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





