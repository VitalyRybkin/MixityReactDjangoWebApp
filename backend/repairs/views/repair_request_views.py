from typing import Any

from django.db.models import QuerySet
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response

from core.openapi import ERRORS_DETAIL, ERRORS_DETAIL_WRITE
from core.openapi.base_views import (
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from repairs.models.repair_request_models import RepairPart, RepairRequest
from repairs.serializers.repair_request_serializers import (
    RepairRequestReadSerializer,
    RepairRequestWriteSerializer,
)
from repairs.serializers.repair_specification_serializer import PartItemSerializer


class CustomPagination(PageNumberPagination):
    """
    Custom pagination class for RepairRequestListAPIView.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class RepairRequestListAPIView(BaseListCreateAPIView):
    """
    API view for listing and creating RepairRequests.
    """

    resource_name = "RepairRequests"
    schema_tags = ["Repair Request"]

    read_serializer_class = RepairRequestReadSerializer
    write_serializer_class = RepairRequestWriteSerializer
    pagination_class = CustomPagination

    # serializer_class = RepairRequestReadSerializer
    queryset = RepairRequest._default_manager.all()

    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE
    query_parameters = [
        OpenApiParameter(
            "date_from",
            OpenApiTypes.DATE,
            OpenApiParameter.QUERY,
            description="Filter by date from",
        ),
        OpenApiParameter(
            "date_to",
            OpenApiTypes.DATE,
            OpenApiParameter.QUERY,
            description="Filter by date to",
        ),
        OpenApiParameter(
            "status",
            OpenApiTypes.STR,
            OpenApiParameter.QUERY,
            description="Filter by status",
        ),
        OpenApiParameter(
            "location",
            OpenApiTypes.STR,
            OpenApiParameter.QUERY,
            description="Filter by location",
        ),
        OpenApiParameter(
            "customer_id",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            description="Filter by customer",
        ),
        OpenApiParameter(
            "object_id",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            description="Filter by object",
        ),
        OpenApiParameter(
            "repair_company_id",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            description="Filter by repair company",
        ),
    ]

    def get_serializer_class(self) -> Any:
        if self.request.method == "POST":
            return self.write_serializer_class
        return self.read_serializer_class

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(
            self.get_queryset(),
            request,
            view=self,
        )
        serializer = self.read_serializer_class(
            result_page, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)

    def get_queryset(self) -> QuerySet[RepairRequest]:
        queryset = RepairRequest._default_manager.select_related(
            "construction_object",
            "construction_object__customer",
            "repair_company",
            "created_by",
        ).prefetch_related(
            "request_files",
            "closing_files",
            "specifications__service",
            "specifications__part",
        )

        params = self.request.query_params

        if date_from := params.get("date_from"):
            queryset = queryset.filter(request_date__gte=date_from)

        if date_to := params.get("date_to"):
            queryset = queryset.filter(request_date__lte=date_to)

        if status := params.get("status"):
            queryset = queryset.filter(status=status)

        if location := params.get("location"):
            queryset = queryset.filter(location=location)

        if customer_id := params.get("customer_id"):
            queryset = queryset.filter(construction_object__customer_id=customer_id)

        if object_id := params.get("object_id"):
            queryset = queryset.filter(construction_object_id=object_id)

        if repair_company_id := params.get("repair_company_id"):
            queryset = queryset.filter(repair_company_id=repair_company_id)

        return queryset.order_by("-id")


class RepairRequestRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView,
):
    """
    API view for retrieving, updating, and deleting a RepairRequest.
    """

    resource_name = "RepairRequest"
    schema_tags = ["Repair Request"]

    read_serializer_class = RepairRequestReadSerializer
    write_serializer_class = RepairRequestWriteSerializer

    serializer_class = RepairRequestWriteSerializer

    errors_read = ERRORS_DETAIL
    errors_write = ERRORS_DETAIL_WRITE

    queryset = RepairRequest._default_manager.select_related(
        "construction_object",
        "created_by",
        "repair_company",
    ).prefetch_related(
        "closing_files",
        "request_files",
        "specifications__service",
        "specifications__part",
    )

    def get_serializer_class(
        self,
    ) -> type[RepairRequestWriteSerializer | RepairRequestReadSerializer]:
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return self.write_serializer_class
        return self.read_serializer_class

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()
        serializer = self.write_serializer_class(
            instance, context=self.get_serializer_context()
        )
        serializer.destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RepairPartsListAPIView(BaseListCreateAPIView):
    """
    API view for listing and creating RepairParts.
    """

    resource_name = "RepairPart"
    schema_tags = ["Repair Specification"]

    queryset = RepairPart._default_manager.all()
    read_serializer_class = PartItemSerializer
    write_serializer_class = PartItemSerializer

    serializer_class = PartItemSerializer


class RepairPartsRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    """
    API view for retrieving, updating, and deleting a RepairPart.
    """

    resource_name = "RepairPart"
    schema_tags = ["Repair Specification"]

    queryset = RepairPart._default_manager.all()
    read_serializer_class = PartItemSerializer
    write_serializer_class = PartItemSerializer

    serializer_class = PartItemSerializer
