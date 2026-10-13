from rest_framework import serializers

from repairs.models.repair_request_models import RequestFile, ClosingFile, RepairRequest


class RepairRequestFileReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestFile
        fields = [
            "id",
            "file_name",
            "file",
        ]


class RepairRequestFileWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestFile
        fields = [
            "id",
            "file_name",
            "file",
        ]

class RepairClosingFileReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClosingFile
        fields = [
            "id",
            "file_name",
            "file",
        ]

class RepairClosingFileWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClosingFile
        fields = [
            "id",
            "file_name",
            "file",
        ]


class RepairFilesSerializer(serializers.Serializer):
    closing_files = RepairClosingFileReadSerializer(many=True, read_only=True)
    request_files = RepairRequestFileReadSerializer(many=True, read_only=True)

    class Meta:
        model = RepairRequest
        fields = [
            "closing_files",
            "request_files",
        ]





