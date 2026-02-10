from typing import Any

from rest_framework import serializers

from catalog.models import AppUnit


class UnitBaseSerializer(serializers.ModelSerializer):
    """
    Handles serialization of the AppUnit model.

    Attributes:
        isWeightBased: Indicates if the unit is weight-based. Maps to "is_weight_based".
        toKgFactor: Conversion factor of the unit to kilograms. Maps to "to_kg_factor".
        title: The display name/title of the unit.

    """

    isWeightBased = serializers.BooleanField(source="is_weight_based")
    toKgFactor = serializers.FloatField(source="to_kg_factor")
    title = serializers.SerializerMethodField()

    class Meta:
        model = AppUnit
        fields = [
            "id",
            "title",
            "isWeightBased",
            "toKgFactor",
        ]

    @staticmethod
    def get_title(obj: Any) -> str:
        return obj.get_title_display()


class UnitListCreateSerializer(UnitBaseSerializer):
    pass


class UnitRetrieveUpdateDestroySerializer(UnitBaseSerializer):
    pass
