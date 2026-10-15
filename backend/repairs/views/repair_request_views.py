from typing import Any, Type

from django.db.models import QuerySet
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response

from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from repairs.models.repair_request_models import RepairPart, RepairRequest
from repairs.serializers.repair_request_serializers import (
    PartSerializer,
    RepairRequestReadSerializer,
    RepairRequestWriteSerializer,
)


class CustomPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 100


class RepairRequestListAPIView(BaseListCreateAPIView):
    resource_name = "RepairRequestList"
    schema_tags = ["Repair Request"]

    read_serializer_class = RepairRequestReadSerializer
    write_serializer_class = RepairRequestWriteSerializer
    pagination_class = CustomPagination

    serializer_class = RepairRequestReadSerializer
    queryset = RepairRequest._default_manager.all()

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
    resource_name = "RepairRequest"
    schema_tags = ["Repair Requests"]

    read_serializer_class = RepairRequestReadSerializer
    write_serializer_class = RepairRequestWriteSerializer

    serializer_class = RepairRequestWriteSerializer

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

    def get_serializer_class(self) -> Type[serializers.ModelSerializer]:
        if self.request.method == "GET":
            return self.read_serializer_class

        return self.write_serializer_class


class RepairPartsListAPIView(BaseListAPIView):
    resource_name = "RepairPart"
    schema_tags = ["Repair Specification"]

    serializer_class = PartSerializer
    queryset = RepairPart._default_manager.all()

    read_serializer_class = PartSerializer
