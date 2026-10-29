from django.db import transaction
from rest_framework import serializers

from order.models import ConstructionObject
from order.serializers.customer_serializers import BaseCustomerObjectsSerializer
from repairs.models import RepairCompany
from repairs.models.repair_request_models import (
    RepairRequest,
)
from repairs.serializers.repair_file_serializers import (
    RepairClosingFileReadSerializer,
    RepairRequestFileReadSerializer,
)
from repairs.serializers.repair_specification_serializer import (
    RepairSpecificationReadSerializer,
    RepairSpecificationWriteSerializer,
)
from repairs.services.specification_items import sync_specification_items


class RepairConstructionObjectSerializer(BaseCustomerObjectsSerializer):
    """
    Serializer for RepairConstructionObject.
    """

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
    """
    Serializer for RepairRequest.
    """

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


class RepairRequestListSerializer(RepairRequestSerializer):
    has_rebillable_items = serializers.BooleanField(read_only=True)
    request_sum = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)

    class Meta(RepairRequestSerializer.Meta):
        fields = RepairRequestSerializer.Meta.fields + [
            "has_rebillable_items",
            "request_sum",
        ]


class RepairRequestReadSerializer(RepairRequestSerializer):
    """
    Serializer for reading RepairRequest.
    """

    request_files = RepairRequestFileReadSerializer(many=True, read_only=True)
    closing_files = RepairClosingFileReadSerializer(many=True, read_only=True)
    specifications = RepairSpecificationReadSerializer(many=True, read_only=True)

    class Meta(RepairRequestSerializer.Meta):
        fields = RepairRequestSerializer.Meta.fields + [
            "request_files",
            "closing_files",
            "specifications",
        ]


class RepairRequestWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for writing RepairRequest.
    """

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
    specifications = RepairSpecificationWriteSerializer(
        many=True,
        write_only=True,
        required=False,
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
            "specifications",
        ]
        read_only_fields = [
            "id",
            "created_by",
        ]

    @transaction.atomic
    def create(self, validated_data: dict) -> RepairRequest:
        specifications_data = validated_data.pop("specifications", [])

        request = self.context.get("request")

        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        repair_request = RepairRequest._default_manager.create(**validated_data)

        sync_specification_items(
            repair_request,
            specifications_data,
        )

        return repair_request

    @transaction.atomic
    def update(
        self,
        instance: RepairRequest,
        validated_data: dict,
    ) -> RepairRequest:
        specifications_data = validated_data.pop(
            "specifications",
            None,
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if specifications_data is not None:
            sync_specification_items(
                instance,
                specifications_data,
            )

        return instance

    @transaction.atomic
    def destroy(self, instance: RepairRequest) -> None:
        """
        Deletes the repair request and associated request items.
        """
        instance.delete()
