from rest_framework import serializers

from order.serializers.customer_serializers import BaseCustomerObjectsSerializer
from repairs.models.repair_request_models import (
    ClosingFile,
    RepairPart,
    RepairRequest,
    RepairService,
    RepairSpecification,
    RequestFile,
)


class RepairRequestSerializer(serializers.ModelSerializer):
    construction_object = BaseCustomerObjectsSerializer()

    class Meta:
        model = RepairRequest
        fields = [
            "id",
            "request_date",
            "closing_date",
            "created_by",
            "location",
            "status",
            "construction_object",
            "description",
            "closing_description",
        ]


class RequestFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestFile
        fields = [
            "id",
            "file_name",
        ]


class ClosingFilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClosingFile
        fields = [
            "id",
            "file_name",
        ]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairService
        fields = [
            "id",
            "name",
        ]


class PartSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairPart
        fields = [
            "id",
            "name",
        ]


class RepairSpecificationSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    part = PartSerializer(read_only=True)

    class Meta:
        model = RepairSpecification
        fields = [
            "id",
            "service",
            "part",
            "quantity",
            "price_per_item",
        ]


class RepairRequestReadSerializer(RepairRequestSerializer):
    request_files = RequestFileSerializer(many=True, read_only=True)
    closing_files = ClosingFilesSerializer(many=True, read_only=True)
    specifications = RepairSpecificationSerializer(many=True, read_only=True)

    class Meta(RepairRequestSerializer.Meta):
        fields = RepairRequestSerializer.Meta.fields + [
            "request_files",
            "closing_files",
            "specifications",
        ]
