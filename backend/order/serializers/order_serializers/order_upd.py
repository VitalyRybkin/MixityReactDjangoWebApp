from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from core.validators.files import (
    scan_uploaded_file,
    validate_file_size,
    validate_pdf,
)
from order.models import Order


class OrderUpdSerializer(serializers.ModelSerializer):
    upd_pdf = serializers.FileField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Order
        fields = ["upd_pdf"]

    def validate_upd_pdf(
        self,
        file: UploadedFile | None,
    ) -> UploadedFile | None:
        validate_file_size(file)
        scan_uploaded_file(file)
        return validate_pdf(file, pdf_only=True)
