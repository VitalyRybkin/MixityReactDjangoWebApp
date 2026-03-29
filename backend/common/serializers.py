from typing import Any

from django.urls import reverse
from rest_framework import serializers

from .models import Documentation
from .routes import DocumentationRoutes


class DocumentationSerializer(serializers.ModelSerializer):
    public_url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Documentation
        fields = ["id", "title", "tag", "status", "public_url", "download_url"]

    def get_public_url(self, obj: Documentation) -> Any | None:
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(
            reverse(f"common:{DocumentationRoutes.DETAIL.name}", args=[obj.id])
        )

    def get_download_url(self, obj: Documentation) -> Any | None:
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(
            reverse(f"common:{DocumentationRoutes.DOWNLOAD.name}", args=[obj.id])
        )


class DocumentationBulkDownloadRequestSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
        required=True,
    )
