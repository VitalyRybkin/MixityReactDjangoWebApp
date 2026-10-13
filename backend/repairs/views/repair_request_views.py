from typing import Any

from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response

from core.openapi.base_views import BaseListAPIView, BaseRetrieveUpdateDestroyAPIView
from repairs.models.repair_request_models import RepairPart, RepairRequest
from repairs.serializers.repair_request_serializers import (
    PartSerializer,
    RepairRequestReadSerializer,
    RepairRequestSerializer, )


class CustomPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 100


class RepairRequestListAPIView(BaseListAPIView):
    resource_name = "RepairRequest"
    schema_tags = ["Repair Requests"]

    read_serializer_class = RepairRequestSerializer
    pagination_class = CustomPagination

    serializer_class = RepairRequestSerializer
    queryset = RepairRequest._default_manager.all()

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(self.queryset, request, view=self)
        serializer = self.read_serializer_class(
            result_page, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)


class RepairRequestRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    resource_name = "RepairRequest"
    schema_tags = ["Repair Requests"]

    read_serializer_class = RepairRequestReadSerializer
    write_serializer_class = RepairRequestReadSerializer

    serializer_class = RepairRequestSerializer

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

    def get_serializer_class(self) -> type[RepairRequestReadSerializer]:
        if self.request.GET:
            return self.read_serializer_class
        return self.write_serializer_class


class RepairPartsListAPIView(BaseListAPIView):
    resource_name = "RepairPart"
    schema_tags = ["Repair Specification"]

    serializer_class = PartSerializer
    queryset = RepairPart._default_manager.all()

    read_serializer_class = PartSerializer
