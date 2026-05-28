from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from catalog.models import AppUnit
from catalog.utils.unit_choices import TitleChoices


class UnitSerializer(serializers.ModelSerializer):
    """
    Handles serialization of the AppUnit model.

    Attributes:
        isWeightBased: Indicates if the unit is weight-based. Maps to "is_weight_based".
        toKgFactor: Conversion factor of the unit to kilograms. Maps to "to_kg_factor".
        title: The display name/title of the unit.

    """

    isWeightBased = serializers.BooleanField(source="is_weight_based")
    toKgFactor = serializers.IntegerField(source="to_kg_factor")
    title = serializers.ChoiceField(
        choices=TitleChoices.choices,
        label="title",
    )
    titleDisplay = serializers.CharField(source="get_title_display", read_only=True)

    class Meta:
        model = AppUnit
        fields = ["id", "title", "titleDisplay", "isWeightBased", "toKgFactor"]

    def to_representation(self, instance: Any) -> dict:
        representation = super().to_representation(instance)
        representation["title"] = instance.get_title_display()
        return representation

    def create(self, validated_data: dict) -> AppUnit:
        try:
            return super().create(validated_data)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

    def update(self, instance: AppUnit, validated_data: dict) -> AppUnit:
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
