from typing import Any

from rest_framework.serializers import Serializer

from core.openapi.base_views import BaseListAPIView, BaseRetrieveUpdateDestroyAPIView, BaseListCreateAPIView
from repairs.models.repair_request_models import RepairRequest
from repairs.serializers.repair_file_serializers import RepairFilesSerializer, RepairRequestFileReadSerializer, \
    RepairRequestFileWriteSerializer, RepairClosingFileReadSerializer, RepairClosingFileWriteSerializer


class RepairFilesListAPIView(BaseListAPIView):
    resource_name = "RepairFile"
    schema_tags = ["Repair Files"]

    serializer_class = RepairFilesSerializer
    queryset = RepairRequest._default_manager.all().prefetch_related(
        "closing_files",
        "request_files",
    )

    read_serializer_class = RepairFilesSerializer

    def get_queryset(self):
        return self.queryset.filter(id=self.kwargs["pk"])

class RepairRequestListCreateAPIView(BaseListCreateAPIView):
    resource_name = "RepairRequest"
    schema_tags = ["Repair Requests"]

    serializer_class = RepairRequestFileReadSerializer
    queryset = RepairRequest._default_manager.all()

    read_serializer_class = RepairRequestFileReadSerializer
    write_serializer_class = RepairRequestFileWriteSerializer

    def get_serializer(self, *args: Any, **kwargs: Any) -> Serializer:
        if self.request.method in ("POST", "PUT", "PATCH"):
            return self.write_serializer_class(*args, **kwargs)
        return self.read_serializer_class(*args, **kwargs)


class RepairRequestRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    pass


class RepairClosingListCreateAPIView(BaseListCreateAPIView):
    resource_name = "RepairClosing"
    schema_tags = ["Repair Closings"]

    serializer_class = RepairClosingFileReadSerializer
    queryset = RepairRequest._default_manager.all()

    read_serializer_class = RepairClosingFileReadSerializer
    write_serializer_class = RepairClosingFileWriteSerializer

    def get_serializer(self, *args: Any, **kwargs: Any) -> Serializer:
        if self.request.method in ("POST", "PUT", "PATCH"):
            return self.write_serializer_class(*args, **kwargs)
        return self.read_serializer_class(*args, **kwargs)


class RepairClosingRetrieveUpdateDestroyAPIView(BaseRetrieveUpdateDestroyAPIView):
    pass