from rest_framework import serializers

from core.models import Documentation


class DocumentationSerializer(serializers.ModelSerializer):
    public_url = serializers.SerializerMethodField()

    class Meta:
        model = Documentation
        fields = ["id", "title", "tag", "public_url"]

    def get_public_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/docs/{obj.id}/")
        return None