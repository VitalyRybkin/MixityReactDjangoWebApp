from typing import Any

from django.urls import reverse
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Documentation
from .routes import DocumentationRoutes

User = get_user_model()


class CurrentUserSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "is_superuser",
            "groups",
            "permissions",
        )

    def get_groups(self, user: User) -> list[str]:
        return list(user.groups.values_list("name", flat=True))

    def get_permissions(self, user: User) -> list[str]:
        if user.is_superuser:
            return ["*"]

        return sorted(user.get_all_permissions())


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
