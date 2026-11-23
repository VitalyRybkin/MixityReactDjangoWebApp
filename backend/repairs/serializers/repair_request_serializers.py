from django.db import transaction
from rest_framework import serializers

from order.models import ConstructionObject
from order.models.rental_contract import RentalContract
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

    construction_object = RepairConstructionObjectSerializer(read_only=True)
    rental_contract_number = serializers.CharField(
        source="rental_contract.contract_number",
        read_only=True,
    )
    rental_contract_date = serializers.DateField(
        source="rental_contract.contract_date",
        read_only=True,
    )

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
            "rental_contract",
            "rental_contract_number",
            "rental_contract_date",
            "is_after_return",
        ]


class RepairRequestListSerializer(RepairRequestSerializer):
    has_rebillable_items = serializers.BooleanField(read_only=True)
    request_sum = serializers.DecimalField(
        read_only=True, max_digits=10, decimal_places=2
    )

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
            "description",
            "inspection_description",
            "closing_description",
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
    rental_contract = serializers.PrimaryKeyRelatedField(
        queryset=RentalContract.objects.all(),
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "Выбранный договор аренды не существует.",
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
            "rental_contract",
            "is_after_return",
            "description",
            "inspection_description",
            "closing_description",
            "specifications",
        ]
        read_only_fields = [
            "id",
            "created_by",
        ]

    def validate(self, attrs: dict) -> dict:
        """Enforce the contract/customer match without breaking legacy repairs."""
        attrs = super().validate(attrs)
        instance = self.instance
        construction_object = (
            attrs["construction_object"]
            if "construction_object" in attrs
            else (instance.construction_object if instance is not None else None)
        )
        rental_contract = (
            attrs["rental_contract"]
            if "rental_contract" in attrs
            else (instance.rental_contract if instance is not None else None)
        )
        location = attrs.get(
            "location",
            instance.location if instance is not None else RepairRequest.Location.SITE,
        )
        is_after_return = attrs.get(
            "is_after_return",
            instance.is_after_return if instance is not None else False,
        )

        errors = {}
        if rental_contract is None and (
            instance is None
            or (instance.rental_contract_id is not None)
            or is_after_return
        ):
            errors["rental_contract"] = "Выберите договор аренды."
        if construction_object and rental_contract:
            if construction_object.customer_id != rental_contract.customer_id:
                errors["rental_contract"] = (
                    "Договор не принадлежит заказчику выбранного объекта."
                )
        if is_after_return and location != RepairRequest.Location.WORKSHOP:
            errors["is_after_return"] = (
                "Ремонт после возврата выполняется в мастерской."
            )
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

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


class RepairRequestExportReadSerializer(serializers.ModelSerializer):
    customer = serializers.CharField(
        source="construction_object.customer.name",
        read_only=True,
    )
    repair_company = serializers.CharField(
        source="repair_company.name",
        read_only=True,
    )
    construction_object = serializers.CharField(
        source="construction_object.name",
        read_only=True,
    )
    construction_object_address = serializers.CharField(
        source="construction_object.address",
        read_only=True,
    )
    rental_contract_number = serializers.CharField(
        source="rental_contract.contract_number",
        read_only=True,
    )
    rental_contract_date = serializers.DateField(
        source="rental_contract.contract_date",
        read_only=True,
    )
    request_sum = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = RepairRequest
        fields = [
            "id",
            "request_date",
            "closing_date",
            "status",
            "location",
            "customer",
            "construction_object",
            "construction_object_address",
            "repair_company",
            "request_sum",
            "description",
            "inspection_description",
            "closing_description",
            "rental_contract_number",
            "rental_contract_date",
            "is_after_return",
        ]
