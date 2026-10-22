from rest_framework import serializers
from rest_framework.relations import PrimaryKeyRelatedField

from repairs.models.repair_request_models import (
    RepairPart,
    RepairService,
    RepairSpecification,
)


class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairService
        fields = [
            "id",
            "name",
        ]


class PartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairPart
        fields = [
            "id",
            "name",
        ]


class RepairSpecificationReadSerializer(serializers.ModelSerializer):
    service = ServiceItemSerializer(many=True, read_only=True)
    part = PartItemSerializer(many=True, read_only=True)

    class Meta:
        model = RepairSpecification
        fields = [
            "id",
            "service",
            "part",
            "quantity",
            "price_per_item",
        ]


class RepairSpecificationWriteSerializer(serializers.ModelSerializer):
    service = PrimaryKeyRelatedField(
        queryset=RepairService._default_manager.all(),
        error_messages={
            "null": "Выберите услугу.",
            "required": "Выберите услугу.",
            "does_not_exist": "Выбранная услуга не существует.",
        },
    )
    part = PrimaryKeyRelatedField(
        queryset=RepairPart._default_manager.all(),
        error_messages={
            "null": "Выберите деталь.",
            "required": "Выберите деталь.",
            "does_not_exist": "Выбранная деталь не существует.",
        },
    )
    quantity = serializers.DecimalField(
        min_value=1,
        max_digits=10,
        decimal_places=2,
        error_messages={
            "null": "Укажите количество.",
            "required": "Укажите количество.",
            "invalid": "Введите корректное число.",
        },
    )
    price_per_item = serializers.DecimalField(
        min_value=0,
        max_digits=10,
        decimal_places=2,
        error_messages={
            "null": "Укажите цену за единицу.",
            "required": "Укажите цену за единицу.",
            "invalid": "Введите корректную цену.",
        },
    )

    class Meta:
        model = RepairSpecification
        fields = [
            "id",
            "service",
            "part",
            "quantity",
            "price_per_item",
        ]
