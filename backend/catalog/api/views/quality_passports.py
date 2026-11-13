"""Expose quality-passport state previews for order products."""

from django.db.models import OuterRef, Prefetch, Subquery
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from catalog.api.serializers.passport_serializers import (
    QualityPassportReadSerializer,
    QualityPassportStateQuerySerializer,
)
from catalog.api.serializers.prodcut_specification_serializer import (
    ProductSpecificationReadSerializer,
)
from catalog.models import Product, ProductSpecification, QualityPassport
from catalog.services.quality_passport_state import QualityPassportStateService
from core.openapi import ERRORS_DETAIL
from core.openapi.base_views import (
    BaseGenericAPIView,
    BaseRetrieveAPIView,
)
from order.models import Order, OrderItem


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


class QualityPassportRetrieveAPIView(BaseRetrieveAPIView):
    """
    Retrieve a quality passport resource through the API.

    Provides a class-based API view for working with a single quality passport
    record. The view is intended for detail-level operations and relies on the
    configured base behavior to resolve the target resource, serialize response
    data, and apply standardized API error handling.
    """

    resource_name = "quality_passport"
    schema_tags = ["QualityPassport"]

    read_serializer_class = QualityPassportReadSerializer
    serializer_class = QualityPassportReadSerializer

    queryset = QualityPassport.objects.select_related(
        "product",
        "created_by",
    ).order_by("id")

    errors_read = ERRORS_DETAIL

    # Exporters of orders may read only passports attached to created orders.
    # Catalogue users retain access to all passports through their own view permission.
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.has_perm("catalog.view_qualitypassport"):
            return queryset

        if user.has_perm("order.export_order"):
            exported_passports = OrderItem.objects.filter(
                order__status=Order.Status.CREATED,
            ).values("quality_passport_id")
            return queryset.filter(pk__in=exported_passports)

        raise PermissionDenied()


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

    read_serializer_class = ProductSpecificationReadSerializer
    serializer_class = ProductSpecificationReadSerializer
    errors_read = ERRORS_DETAIL
    schema_parameters = [
        OpenApiParameter("as_of", OpenApiTypes.DATE, OpenApiParameter.QUERY),
    ]

    def get_queryset(self):
        as_of_param = self.request.query_params.get("as_of")

        as_of = (
            serializers.DateField().run_validation(as_of_param)
            if as_of_param is not None
            else timezone.localdate()
        )

        latest = (
            ProductSpecification.objects.filter(
                product_id=OuterRef("product_id"),
                name_id=OuterRef("name_id"),
                effective_from__lte=as_of,
            )
            .order_by("-effective_from", "-pk")
            .values("pk")[:1]
        )

        return Product.objects.prefetch_related(
            Prefetch(
                "specs",
                queryset=ProductSpecification.objects.filter(
                    pk=Subquery(latest),
                ).select_related("unit", "name"),
            )
        )
