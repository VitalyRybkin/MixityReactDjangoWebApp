"""Expose quality-passport state previews for order products."""

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from catalog.api.serializers.passport_serializers import (
    QualityPassportReadSerializer,
    QualityPassportWriteSerializer,
)
from catalog.api.serializers.prodcut_specification_serializer import (
    ProductSpecificationReadSerializer,
)
from catalog.api.serializers.quality_passport_serializers import (
    QualityPassportStateQuerySerializer,
)
from catalog.models import Product, ProductSpecification, QualityPassport
from catalog.services.quality_passport_state import QualityPassportStateService
from core.openapi import ERRORS_DETAIL, ERRORS_DETAIL_WRITE
from core.openapi.base_views import (
    BaseGenericAPIView,
    BaseRetrieveAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from order.models import Order


class QualityPassportStateAPIView(BaseGenericAPIView):
    """Provide authenticated users with a read-only passport-state preview.

    Require order-view permission and restrict passport-issuance availability
    according to the user's permission to add or change the target order.
    """

    resource_name = "quality_passport_state"
    schema_tags = ["QualityPassport"]
    permission_classes = [IsAuthenticated]
    read_serializer_class = QualityPassportStateQuerySerializer

    serializer_class = QualityPassportStateQuerySerializer

    http_method_names = ["get", "head", "options"]

    def get(self, request: Request) -> Response:
        """Validate query parameters and return the projected passport state.

        Resolve the requested product and optional order. Use the supplied
        target status, falling back to the existing order status or draft for
        a new order. Limit the returned can_issue_new_passport flag using
        change-order permission for an existing order or add-order permission
        for a new one. This endpoint does not issue or assign passports.

        Raises:
            PermissionDenied: If the user lacks order-view permission.
            ValidationError: If query parameters are invalid.
            Http404: If the requested product or order does not exist.
        """
        if not request.user.has_perm("order.view_order"):
            raise PermissionDenied()

        query = QualityPassportStateQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data

        product = get_object_or_404(
            Product,
            pk=params["product_id"],
        )

        order = None

        if "order_id" in params:
            order = get_object_or_404(
                Order,
                pk=params["order_id"],
            )

        target_status = params.get(
            "target_status",
            order.status if order is not None else Order.Status.DRAFT,
        )

        state = QualityPassportStateService.get_state(
            product=product,
            quantity=params.get("quantity"),
            order=order,
            target_status=target_status,
        )

        write_permission = (
            "order.change_order" if order is not None else "order.add_order"
        )

        state["can_issue_new_passport"] = state[
            "can_issue_new_passport"
        ] and request.user.has_perm(write_permission)

        return Response(state)


class QualityPassportRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """Retrieve passport details with related product and creator data.

    Allow GET, HEAD, and OPTIONS requests. Updates and deletion remain disabled
    despite the CRUD base class and the retained write-serializer configuration.
    """

    http_method_names = ["get", "head", "options"]

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
    """
    Retrieves detailed product specification data for a product resource.

    Provides a read-only API view configured to expose product specification
    details through the product API. The view uses a serializer dedicated to
    product specification output and prepares an optimized product queryset that
    prefetches related specification data, including each specification unit and
    name, for efficient retrieval.
    """

    resource_name = "product_specification"
    schema_tags = ["Product"]

    serializer_class = ProductSpecificationReadSerializer

    queryset = Product.objects.prefetch_related(
        Prefetch(
            "specs",
            queryset=ProductSpecification.objects.select_related("unit", "name"),
        )
    )
