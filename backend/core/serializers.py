from typing import Any

from django.urls import reverse
from rest_framework import serializers

from .models import Documentation


class DocumentationSerializer(serializers.ModelSerializer):
    public_url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Documentation
        fields = ["id", "title", "tag", "public_url", "download_url"]

    def get_public_url(self, obj: Documentation) -> Any | None:
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(reverse("doc-detail", args=[obj.id]))

    def get_download_url(self, obj: Documentation) -> Any | None:
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(reverse("doc-download", args=[obj.id]))