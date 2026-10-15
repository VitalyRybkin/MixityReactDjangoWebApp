from typing import Any

from django.db.models import QuerySet
from rest_framework.serializers import BaseSerializer, Serializer

from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from repairs.models.repair_request_models import (
    ClosingFile,
    RepairRequest,
    RequestFile,
)
from repairs.serializers.repair_file_serializers import (
    RepairClosingFileReadSerializer,
    RepairClosingFileWriteSerializer,
    RepairFilesSerializer,
    RepairRequestFileReadSerializer,
    RepairRequestFileWriteSerializer,
)


class RepairFilesListAPIView(BaseListAPIView):
    resource_name = "RepairFiles"
    schema_tags = ["Repair Request"]

    serializer_class = RepairFilesSerializer
    read_serializer_class = RepairFilesSerializer

    def get_queryset(self) -> QuerySet[RepairRequest]:
        return RepairRequest._default_manager.filter(
            pk=self.kwargs["pk"]
        ).prefetch_related(
            "request_files",
            "closing_files",
        )


class RepairRequestFileListCreateAPIView(BaseListCreateAPIView):
    resource_name = "RepairRequestFileList"
    schema_tags = ["Repair Request File"]

    serializer_class = RepairRequestFileReadSerializer
    read_serializer_class = RepairRequestFileReadSerializer
    write_serializer_class = RepairRequestFileWriteSerializer

    def get_queryset(self) -> QuerySet[RequestFile]:
        return RequestFile._default_manager.filter(
            repair_request_id=self.kwargs["pk"],
        )

    def get_serializer(self, *args: Any, **kwargs: Any) -> Serializer:
        if self.request.method == "POST":
            return self.write_serializer_class(*args, **kwargs)

        return self.read_serializer_class(*args, **kwargs)

    def perform_create(self, serializer: BaseSerializer[Any]) -> None:
        serializer.save(
            repair_request_id=self.kwargs["pk"],
        )


class RepairRequestFileRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView,
):
    resource_name = "RepairRequestFile"
    schema_tags = ["Repair Request File"]

    serializer_class = RepairRequestFileReadSerializer
    read_serializer_class = RepairRequestFileReadSerializer
    write_serializer_class = RepairRequestFileWriteSerializer

    def get_queryset(self) -> QuerySet[RequestFile]:
        return RequestFile._default_manager.filter(
            repair_request_id=self.kwargs["pk"],
        )

    lookup_url_kwarg = "file_pk"


class RepairClosingFileListCreateAPIView(BaseListCreateAPIView):
    resource_name = "RepairClosingFile"
    schema_tags = ["Repair Closing File"]

    serializer_class = RepairClosingFileReadSerializer
    read_serializer_class = RepairClosingFileReadSerializer
    write_serializer_class = RepairClosingFileWriteSerializer

    def get_queryset(self) -> QuerySet[ClosingFile]:
        return ClosingFile._default_manager.filter(
            repair_request_id=self.kwargs["pk"],
        )

    def get_serializer(self, *args: Any, **kwargs: Any) -> Serializer:
        if self.request.method == "POST":
            return self.write_serializer_class(*args, **kwargs)

        return self.read_serializer_class(*args, **kwargs)

    def perform_create(self, serializer: BaseSerializer[Any]) -> None:
        serializer.save(
            repair_request_id=self.kwargs["pk"],
        )


class RepairClosingFileRetrieveUpdateDestroyAPIView(
    BaseRetrieveUpdateDestroyAPIView,
):
    resource_name = "RepairClosingFile"
    schema_tags = ["Repair Closing File"]

    serializer_class = RepairClosingFileReadSerializer
    read_serializer_class = RepairClosingFileReadSerializer
    write_serializer_class = RepairClosingFileWriteSerializer

    def get_queryset(self) -> QuerySet[ClosingFile]:
        return ClosingFile._default_manager.filter(
            repair_request_id=self.kwargs["pk"],
        )

    lookup_url_kwarg = "file_pk"
