from typing import Any

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from django.http import FileResponse, HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.serializers import (
    CurrentUserSerializer,
    DocumentationBulkDownloadRequestSerializer,
    DocumentationSerializer,
    DocumentationShareLinksRequestSerializer,
    DocumentationShareLinksResponseSerializer,
)
from common.services.documentation_files import (
    build_documents_zip,
    get_documentation_file_parts,
)
from common.services.documentation_sharing import (
    create_documentation_share_tokens,
    get_shared_document,
    open_shared_document,
)
from core.openapi import ERRORS_WRITE
from core.openapi.base_views import BaseGenericAPIView, BaseListAPIView
from core.services.docs_index import build_docs_index_sections

from .models import Documentation
from .routes import DocumentationRoutes


@extend_schema(
    tags=["User"],
    summary="User groups and permissions",
)
class UserMeView(RetrieveAPIView):
    """
    API view to retrieve the current user's information.
    """

    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> AbstractBaseUser | AnonymousUser:
        return self.request.user


class DocumentsListAPIView(BaseListAPIView, generics.ListAPIView):
    """
    API view to list all documents.
    """

    resource_name = "Documentation"
    schema_tags = ["Documentation"]
    read_serializer_class = DocumentationSerializer

    queryset = Documentation.objects.all()
    serializer_class = DocumentationSerializer


class DocumentationDetailView(BaseGenericAPIView, APIView):
    """
    View to serve a documentation file inline.
    """

    resource_name = "Documentation"
    schema_tags = ["Documentation"]
    read_serializer_class = DocumentationSerializer

    serializer_class = DocumentationSerializer
    queryset = Documentation.objects.all()

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
    queryset = Documentation.objects.all()

    read_serializer_class = DocumentationSerializer
    serializer_class = DocumentationSerializer

    def get(self, request: HttpRequest, pk: int) -> FileResponse:
        doc = get_object_or_404(Documentation, pk=pk)
        file_obj, filename = get_documentation_file_parts(doc)

        return FileResponse(
            file_obj,
            as_attachment=True,
            filename=filename,
        )


class DocumentationBulkDownloadView(generics.CreateAPIView):
    """
    View to serve multiple documentation files as a zip archive.
    """

    queryset = Documentation.objects.all()

    serializer_class = DocumentationBulkDownloadRequestSerializer

    @extend_schema(
        operation_id="createDocumentation bulk download",
        tags=["Documentation"],
        summary="Download selected documents as a ZIP archive",
        request=DocumentationBulkDownloadRequestSerializer,
        responses={(200, "application/zip"): OpenApiTypes.BINARY, **ERRORS_WRITE},
    )
    def post(self, request: Request, *args: Any, **kwargs: Any) -> FileResponse:  # type: ignore[override]
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data["ids"]
        zip_buffer = build_documents_zip(ids)

        return FileResponse(
            zip_buffer,
            as_attachment=True,
            filename="documents.zip",
            content_type="application/zip",
        )


class DocumentationSharePermission(BasePermission):
    def has_permission(self, request: Request, view: APIView) -> bool:
        return request.user.has_perm("common.view_documentation")


@extend_schema(
    tags=["Documentation"],
    summary="Create seven-day recipient links for selected documents",
    request=DocumentationShareLinksRequestSerializer,
    responses=DocumentationShareLinksResponseSerializer,
)
class DocumentationShareLinksView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, DocumentationSharePermission]
    serializer_class = DocumentationShareLinksRequestSerializer

    def post(self, request: Request) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens, expires_at = create_documentation_share_tokens(
            serializer.validated_data["ids"]
        )
        links = [
            {
                "id": document.pk,
                "title": document.title,
                "url": request.build_absolute_uri(
                    reverse(
                        f"common:{DocumentationRoutes.SHARED_FILE.name}",
                        args=[token],
                    )
                ),
            }
            for document, token in tokens
        ]
        response = Response({"links": links, "expires_at": expires_at.isoformat()})
        response["Cache-Control"] = "private, no-store"
        return response


@extend_schema(tags=["Documentation"], auth=[], responses=bytes)
class DocumentationSharedFileView(APIView):
    # The signed URL is the grant. An expired JWT in a recipient's browser
    # must not reject an otherwise valid link before token verification.
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request: Request, token: str) -> FileResponse:
        document = get_shared_document(token)
        file_obj = open_shared_document(document)
        return FileResponse(
            file_obj,
            as_attachment=False,
            filename=document.file.name.rsplit("/", 1)[-1],
        )

    def finalize_response(
        self, request: Request, response: Any, *args: Any, **kwargs: Any
    ) -> Any:
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        response["Referrer-Policy"] = "no-referrer"
        response["X-Content-Type-Options"] = "nosniff"
        return response


def doc_page(request: HttpRequest) -> HttpResponse:
    docs = build_docs_index_sections()
    return render(request, "core/docs_index.html", {"docs": docs})
