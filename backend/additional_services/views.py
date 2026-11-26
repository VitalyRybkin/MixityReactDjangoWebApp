"""Authenticated, permission-checked CRUD and filters for additional services."""

from typing import Any

from django.db.models import QuerySet
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.openapi import (
    ERRORS_DETAIL_WRITE,
    ERRORS_FILTERED_DETAIL,
    ERRORS_WRITE,
)
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)

from .filters import filter_additional_services
from .models import AdditionalServiceRequest
from .serializers import (
    AdditionalServiceReadSerializer,
    AdditionalServiceWriteSerializer,
)


class ViewModelPermissions(DjangoModelPermissions):
    """DRF's default DjangoModelPermissions does not check view permissions on GET."""

    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": ["%(app_label)s.view_%(model_name)s"],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }


class AdditionalServicesPagination(PageNumberPagination):
    """Paginate service requests with a client-adjustable page size."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


SCHEMA_TAGS = ["Additional Services"]
COMMON_PARAMETERS = [
    OpenApiParameter(
        "direction",
        OpenApiTypes.STR,
        description="delivery, return, site_work; comma-separated or repeated",
    ),
    OpenApiParameter(
        "provider_type", OpenApiTypes.STR, description="carrier, repair_company"
    ),
    OpenApiParameter(
        "service_type",
        OpenApiTypes.STR,
        description="Exact pair, e.g. site_work_repair_company",
    ),
    OpenApiParameter(
        "composition",
        OpenApiTypes.STR,
        description="transport_only, specialist_only, both",
    ),
    OpenApiParameter(
        "item_category", OpenApiTypes.STR, description="transport or specialist"
    ),
    OpenApiParameter(
        "item_name",
        OpenApiTypes.STR,
        description="Case-insensitive substring of item name",
    ),
    OpenApiParameter("customer_id", OpenApiTypes.INT),
    OpenApiParameter("object_id", OpenApiTypes.INT),
    OpenApiParameter("rental_contract_id", OpenApiTypes.INT),
    OpenApiParameter("carrier_id", OpenApiTypes.INT),
    OpenApiParameter("repair_company_id", OpenApiTypes.INT),
    OpenApiParameter("date_from", OpenApiTypes.DATE),
    OpenApiParameter("date_to", OpenApiTypes.DATE),
    OpenApiParameter("status", OpenApiTypes.STR),
]


class FilteredAdditionalServicesView(generics.GenericAPIView[AdditionalServiceRequest]):
    """Load and filter service requests for the REST endpoints."""

    queryset = AdditionalServiceRequest.objects.all()

    def get_queryset(self) -> QuerySet[AdditionalServiceRequest]:
        """Return filtered requests with their related records and items loaded."""
        base = AdditionalServiceRequest.objects.select_related(
            "construction_object",
            "construction_object__customer",
            "rental_contract",
            "carrier",
            "repair_company",
        ).prefetch_related("items")
        return filter_additional_services(base, self.request.query_params).order_by(
            "-service_date", "-id"
        )


class AdditionalServiceListCreateAPIView(
    FilteredAdditionalServicesView, BaseListCreateAPIView
):
    """List and create additional service requests."""

    permission_classes = (IsAuthenticated, ViewModelPermissions)
    pagination_class = AdditionalServicesPagination

    resource_name = "AdditionalServiceRequest"
    schema_tags = SCHEMA_TAGS
    schema_read_errors = ERRORS_FILTERED_DETAIL
    schema_write_errors = ERRORS_WRITE
    query_parameters = COMMON_PARAMETERS
    read_serializer_class = AdditionalServiceReadSerializer
    write_serializer_class = AdditionalServiceWriteSerializer

    def get_serializer_class(
        self,
    ) -> type[AdditionalServiceReadSerializer] | type[AdditionalServiceWriteSerializer]:
        """Choose the serializer for the current HTTP method."""
        if self.request.method == "POST":
            return self.write_serializer_class
        return self.read_serializer_class

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Create a request and return its saved specification and totals."""
        write = self.write_serializer_class(
            data=request.data, context=self.get_serializer_context()
        )
        write.is_valid(raise_exception=True)
        instance = write.save()
        instance = _read_instance(instance.pk)
        return Response(
            self.read_serializer_class(
                instance, context=self.get_serializer_context()
            ).data,
            status=status.HTTP_201_CREATED,
        )


class AdditionalServiceDetailAPIView(
    FilteredAdditionalServicesView, BaseRetrieveUpdateDestroyAPIView
):
    """Retrieve, update or delete an additional service request."""

    permission_classes = (IsAuthenticated, ViewModelPermissions)

    resource_name = "AdditionalServiceRequest"
    schema_tags = SCHEMA_TAGS
    schema_read_errors = ERRORS_FILTERED_DETAIL
    schema_write_errors = ERRORS_DETAIL_WRITE
    schema_include_put = True
    schema_hard_delete = True
    read_serializer_class = AdditionalServiceReadSerializer
    write_serializer_class = AdditionalServiceWriteSerializer

    def get_serializer_class(
        self,
    ) -> type[AdditionalServiceReadSerializer] | type[AdditionalServiceWriteSerializer]:
        """Choose the serializer for the current HTTP method."""
        if self.request.method in ("PUT", "PATCH"):
            return self.write_serializer_class
        return self.read_serializer_class

    def put(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Apply a full update and return the saved request."""
        return self._write(request, partial=False)

    def patch(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Apply a partial update and return the saved request."""
        return self._write(request, partial=True)

    def _write(self, request: Request, partial: bool) -> Response:
        """Validate an update and serialize the freshly saved request."""
        instance = self.get_object()
        write = self.write_serializer_class(
            instance,
            data=request.data,
            partial=partial,
            context=self.get_serializer_context(),
        )
        write.is_valid(raise_exception=True)
        instance = write.save()
        instance = _read_instance(instance.pk)
        return Response(
            self.read_serializer_class(
                instance, context=self.get_serializer_context()
            ).data
        )


def _read_instance(pk: int) -> AdditionalServiceRequest:
    """Reload a saved request and its specification by primary key."""
    return (
        AdditionalServiceRequest.objects.select_related(
            "construction_object",
            "construction_object__customer",
            "rental_contract",
            "carrier",
            "repair_company",
        )
        .prefetch_related("items")
        .get(pk=pk)
    )
