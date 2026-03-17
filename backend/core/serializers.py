from rest_framework import serializers

from core.models import Documentation


class DocumentationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documentation
        fields = "__all__"