from typing import Any

from django.http import FileResponse, HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, render
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.views import APIView

from common.serializers import (
    DocumentationBulkDownloadRequestSerializer,
    DocumentationSerializer,
)
from common.services.documentation_files import (
    build_documents_zip,
    get_documentation_file_parts,
)
from core.openapi.base_views import (
    BaseCreateAPIView,
    BaseGenericAPIView,
    BaseListAPIView,
)
from core.services.docs_index import build_docs_index_sections

from .models import Documentation


class DocumentsListAPIView(BaseListAPIView, generics.ListAPIView):
    """
    API view to list all documents.
    """

    resource_name = "Documentation"
    schema_tags = ["Documentation"]
    read_serializer_class = DocumentationSerializer

    queryset = Documentation.objects.all()
    serializer_class = DocumentationSerializer
    permission_classes = [AllowAny]


class DocumentationDetailView(BaseGenericAPIView, APIView):
    """
    View to serve a documentation file inline.
    """

    resource_name = "Documentation"
    schema_tags = ["Documentation"]
    read_serializer_class = DocumentationSerializer
    permission_classes = [AllowAny]

    def get(self, request: HttpRequest, pk: int) -> FileResponse:
        doc = get_object_or_404(Documentation, pk=pk)
        file_obj, _filename = get_documentation_file_parts(doc)

        return FileResponse(file_obj, as_attachment=False)


class DocumentationDownloadView(BaseGenericAPIView, APIView):
    """
    View to download a documentation file.
    """

    resource_name = "Documentation load"
    schema_tags = ["Documentation"]
    read_serializer_class = DocumentationSerializer

    permission_classes = [AllowAny]

    def get(self, request: HttpRequest, pk: int) -> FileResponse:
        doc = get_object_or_404(Documentation, pk=pk)
        file_obj, filename = get_documentation_file_parts(doc)

        return FileResponse(
            file_obj,
            as_attachment=True,
            filename=filename,
        )


class DocumentationBulkDownloadView(BaseCreateAPIView, generics.GenericAPIView):
    """
    View to serve multiple documentation files as a zip archive.
    """

    resource_name = "Documentation bulk download"
    schema_tags = ["Documentation"]
    read_serializer_class = DocumentationBulkDownloadRequestSerializer
    permission_classes = [AllowAny]
    serializer_class = DocumentationBulkDownloadRequestSerializer

    def post(self, request: Request, *args: Any, **kwargs: Any) -> HttpResponse:  # type: ignore[override]
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data["ids"]
        zip_buffer = build_documents_zip(ids)

        response = HttpResponse(zip_buffer.getvalue(), content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="documents.zip"'
        return response


def doc_page(request: HttpRequest) -> HttpResponse:
    docs = build_docs_index_sections()
    return render(request, "core/docs_index.html", {"docs": docs})
