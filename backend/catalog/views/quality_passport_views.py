from rest_framework import serializers

from catalog.models import QualityPassport
from catalog.serializers.passport_serializers import (
    QualityPassportReadSerializer,
    QualityPassportWriteSerializer,
)
from core.openapi import ERRORS_DETAIL, ERRORS_DETAIL_WRITE
from core.openapi.base_views import BaseCreateAPIView, BaseRetrieveUpdateDestroyAPIView


class QualityPassportCreateAPIView(BaseCreateAPIView):
    resource_name = "Quality passport"
    schema_tags = ["QualityPassport"]

    serializer_class = QualityPassportWriteSerializer
    read_serializer_class = QualityPassportReadSerializer

    errors_write = ERRORS_DETAIL_WRITE

    queryset = QualityPassport.objects.all()

    def perform_create(
        self,
        serializer: serializers.BaseSerializer,
    ) -> None:
        serializer.save(created_by=self.request.user)


class QualityPassportRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    resource_name = "Quality passport"
    schema_tags = ["QualityPassport"]

    read_serializer_class = QualityPassportReadSerializer
    write_serializer_class = QualityPassportWriteSerializer

    queryset = QualityPassport.objects.select_related(
        "product",
        "created_by",
    ).order_by("id")

    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE

    def get_serializer_class(
        self,
    ) -> type[QualityPassportWriteSerializer | QualityPassportReadSerializer]:
        if self.request.method in ("PUT", "PATCH"):
            return self.write_serializer_class

        return self.read_serializer_class
