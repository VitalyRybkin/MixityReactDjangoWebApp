"""Expose read-only quality-passport detail endpoints."""

from django.db.models import Prefetch

from catalog.models import Product, ProductSpecification, QualityPassport
from catalog.serializers.passport_serializers import (
    QualityPassportReadSerializer,
    QualityPassportWriteSerializer,
)
from catalog.serializers.prodcut_specification_serializer import (
    ProductSpecificationReadSerializer,
)
from core.openapi import ERRORS_DETAIL, ERRORS_DETAIL_WRITE
from core.openapi.base_views import (
    BaseRetrieveAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)


class QualityPassportRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """Retrieve passport details with related product and creator data.

    Allow GET, HEAD, and OPTIONS requests. Updates and deletion remain disabled
    despite the CRUD base class and the retained write-serializer configuration.
    """

    # http_method_names = ["get", "head", "options"]

    resource_name = "quality_passport"
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
        """Select the read serializer, retaining write selection for PUT and PATCH.

        PUT and PATCH requests are rejected by the view's allowed-method list.
        """
        if self.request.method in ("PUT", "PATCH"):
            return self.write_serializer_class

        return self.read_serializer_class


class ProductSpecificationDetailAPIView(BaseRetrieveAPIView):
    resource_name = "product_specification"
    schema_tags = ["Product"]

    serializer_class = ProductSpecificationReadSerializer

    queryset = Product.objects.prefetch_related(
        Prefetch(
            "specs",
            queryset=ProductSpecification.objects.select_related("unit", "name"),
        )
    )
