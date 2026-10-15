from rest_framework import serializers

from order.serializers.customer_serializers import BaseCustomerObjectsSerializer
from repairs.models.repair_request_models import (
    RepairPart,
    RepairRequest,
    RepairService,
    RepairSpecification,
)
from repairs.serializers.repair_file_serializers import RepairRequestFileReadSerializer, RepairClosingFileReadSerializer


class RepairRequestSerializer(serializers.ModelSerializer):
    construction_object = BaseCustomerObjectsSerializer()

    class Meta:
        model = RepairRequest
        fields = [
            "id",
            "request_date",
            "closing_date",
            "repair_company",
            "created_by",
            "location",
            "status",
            "construction_object",
            "description",
            "closing_description",
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
    request_files = RepairRequestFileReadSerializer(many=True, read_only=True)
    closing_files = RepairClosingFileReadSerializer(many=True, read_only=True)
    specifications = RepairSpecificationSerializer(many=True, read_only=True)

    class Meta(RepairRequestSerializer.Meta):
        fields = RepairRequestSerializer.Meta.fields + [
            "request_files",
            "closing_files",
            "specifications",
        ]

class RepairRequestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairRequest
        fields = [
            "id",
            "request_date",
            "closing_date",
            "created_by",
            "location",
            "status",
            "repair_company",
            "construction_object",
            "description",
            "closing_description",
        ]
        read_only_fields = [
            "id",
            "created_by",
        ]