from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from order.models import Order
from order.validators.upd_pdf import validate_upd_pdf


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
        return validate_upd_pdf(file)
