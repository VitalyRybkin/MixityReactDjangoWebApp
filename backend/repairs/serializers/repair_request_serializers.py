from django.db import transaction
from rest_framework import serializers

from order.models import ConstructionObject
from order.serializers.customer_serializers import BaseCustomerObjectsSerializer
from order.services.order_items import sync_order_items
from repairs.models import RepairCompany
from repairs.models.repair_request_models import (
    RepairRequest,
)
from repairs.serializers.repair_file_serializers import (
    RepairClosingFileReadSerializer,
    RepairRequestFileReadSerializer,
)
from repairs.serializers.repair_specification_serializer import (
    RepairSpecificationWriteSerializer,
)


class RepairConstructionObjectSerializer(BaseCustomerObjectsSerializer):
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True,
    )

    class Meta(BaseCustomerObjectsSerializer.Meta):
        fields = BaseCustomerObjectsSerializer.Meta.fields + [
            "customer",
            "customer_name",
        ]


class RepairRequestSerializer(serializers.ModelSerializer):
    construction_object = RepairConstructionObjectSerializer()

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


class RepairRequestReadSerializer(RepairRequestSerializer):
    request_files = RepairRequestFileReadSerializer(many=True, read_only=True)
    closing_files = RepairClosingFileReadSerializer(many=True, read_only=True)
    specification = RepairSpecificationWriteSerializer(many=True, read_only=True)

    class Meta(RepairRequestSerializer.Meta):
        fields = RepairRequestSerializer.Meta.fields + [
            "request_files",
            "closing_files",
            "specification",
        ]


class RepairRequestWriteSerializer(serializers.ModelSerializer):
    repair_company = serializers.PrimaryKeyRelatedField(
        queryset=RepairCompany.objects.active(),
        error_messages={
            "does_not_exist": "Выбранная компания не существует.",
        },
    )
    construction_object = serializers.PrimaryKeyRelatedField(
        queryset=ConstructionObject.objects.active(),
        error_messages={
            "does_not_exist": "Выбранный объект не существует.",
        },
    )
    specification = RepairSpecificationWriteSerializer(
        many=True, read_only=True, required=False
    )

    class Meta:
        model = RepairRequest
        fields = [
            "id",
            "created_at",
            "updated_at",
            "request_date",
            "closing_date",
            "created_by",
            "location",
            "status",
            "repair_company",
            "construction_object",
            "description",
            "closing_description",
            "specification",
        ]
        read_only_fields = [
            "id",
            "created_by",
        ]

    def create(self, validated_data: dict) -> RepairRequest:
        specification_data = validated_data.pop("specification", [])

        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user

        specification = RepairRequest.objects.create(**validated_data)

        if specification_data:
            specification.specification.set(specification_data)  # type: ignore

        sync_order_items(specification, specification_data)

        return specification

    def update(self, instance: RepairRequest, validated_data: dict) -> RepairRequest:
        specification_data = validated_data.pop("specification", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if specification_data is not None:
            sync_order_items(instance, specification_data)

        return instance

    @transaction.atomic
    def destroy(self, instance: RepairRequest) -> None:
        """
        Deletes the repair request and associated request items.
        """
        instance.delete()
