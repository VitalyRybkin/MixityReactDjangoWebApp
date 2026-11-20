"""Expose quality passports and state previews for Catalog and orders."""

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import OuterRef, Prefetch, QuerySet, Subquery
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, serializers, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from catalog.api.serializers.passport_serializers import (
    CatalogPassportProductSerializer,
    CatalogQualityPassportIssueSerializer,
    QualityPassportReadSerializer,
    QualityPassportStateQuerySerializer,
    QualityPassportStateSerializer,
)
from catalog.api.serializers.prodcut_specification_serializer import (
    ProductSpecificationReadSerializer,
)
from catalog.models import Product, ProductSpecification, QualityPassport
from catalog.services.quality_passport_delete import QualityPassportDeleteService
from catalog.services.quality_passport_issue import QualityPassportIssueService
from catalog.services.quality_passport_state import QualityPassportStateService
from core.openapi import ERRORS_DETAIL, ERRORS_READ, ERRORS_WRITE
from core.openapi.base_views import (
    BaseCreateAPIView,
    BaseRetrieveAPIView,
)
from order.models import Order, OrderItem


class QualityPassportStateAPIView(generics.GenericAPIView):
    """Provide the latest Catalog passport or an order-specific projection."""

    permission_classes = [IsAuthenticated]

    serializer_class = QualityPassportStateQuerySerializer

    http_method_names = ["get", "head", "options"]

    @extend_schema(
        operation_id="listquality_passport_states",
        tags=["QualityPassport"],
        summary="Get quality passport state",
        parameters=[QualityPassportStateQuerySerializer],
        responses={200: QualityPassportStateSerializer, **ERRORS_READ},
    )
    def get(self, request: Request) -> Response:
        """Use the Catalog permissions only for the product-level preview."""
        from_catalog = request.query_params.get("source") == "catalog"
        can_view_orders = request.user.has_perm("order.view_order")
        if from_catalog:
            if not request.user.has_perm("catalog.view_product") or not (
                can_view_orders
                or request.user.has_perm("catalog.view_qualitypassport")
                or request.user.has_perm("catalog.add_qualitypassport")
            ):
                raise PermissionDenied()
        elif not can_view_orders:
            raise PermissionDenied()

        query = QualityPassportStateQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data

        if from_catalog:
            product = get_object_or_404(
                Product.objects.select_related("unit_config__unit"),
                pk=params["product_id"],
            )
            state = QualityPassportStateService.get_state(
                product=product,
                quantity=None,
                order=None,
                target_status=Order.Status.DRAFT,
            )
            state["product"] = CatalogPassportProductSerializer(product).data
            return Response(state)

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
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> QuerySet[QualityPassport]:
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

    @extend_schema(
        operation_id="deleteQualityPassport",
        summary="Delete latest unassigned quality passport",
        tags=["QualityPassport"],
        responses={204: None, 403: None, 404: None, 409: None},
    )
    def delete(self, request: Request, pk: int, *args: Any, **kwargs: Any) -> Response:
        if not request.user.has_perm("catalog.delete_qualitypassport"):
            raise PermissionDenied()

        QualityPassportDeleteService.delete_latest_unassigned(passport_id=pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class QualityPassportIssueAPIView(BaseCreateAPIView):
    resource_name = "quality_passport_issue"
    schema_tags = ["QualityPassport"]
    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "options"]

    write_serializer_class = CatalogQualityPassportIssueSerializer
    response_serializer_class = QualityPassportReadSerializer
    serializer_class = CatalogQualityPassportIssueSerializer
    errors_write = ERRORS_WRITE

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        context["issuance_source"] = "catalog"
        return context

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        if not request.user.has_perm("catalog.add_qualitypassport"):
            raise PermissionDenied()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Return 404 for a missing product rather than an uncaught DoesNotExist.
        product = get_object_or_404(Product, pk=data["product_id"])

        try:
            passport = QualityPassportIssueService.issue(
                product_id=product.pk,
                expected_latest_passport_id=data["expected_latest_passport_id"],
                number=data["number"],
                batch_number=data["batch_number"],
                production_date=data["production_date"],
                quantity=data["quantity"],
                issue_date=data["issue_date"],
                created_by=request.user,
                issuance_source="catalog",
                suggested_next_passport_number=data.get(
                    "suggested_next_passport_number"
                ),
            )
        except DjangoValidationError as exc:
            details = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            raise ValidationError(details) from exc

        return Response(
            QualityPassportReadSerializer(passport).data,
            status=status.HTTP_201_CREATED,
        )


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

    def get_queryset(self) -> QuerySet[Product]:
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
