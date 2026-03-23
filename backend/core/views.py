import os
import zipfile
from io import BytesIO
from typing import Any

from django.shortcuts import render
from django.urls import reverse, NoReverseMatch
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from core.models import Documentation
from core.serializers import DocumentationSerializer

from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404, HttpResponse, HttpRequest
from django.views import View


class DocsListAPIView(generics.ListAPIView):
    """
    API view to list all documents.
    """
    queryset = Documentation.objects.all()
    serializer_class = DocumentationSerializer
    permission_classes = [AllowAny]

class DocumentationDetailView(View):
    """
    View to serve documentation files.
    """
    def get(self, request: HttpRequest, pk: int) -> FileResponse:
        doc = get_object_or_404(Documentation, pk=pk)

        if not doc.file:
            raise Http404("Файл не найден")

        return FileResponse(doc.file.open("rb"), as_attachment=False)

class DocumentationDownloadView(View):
    """
    View to serve documentation files.
    """
    def get(self, request: HttpRequest, pk: int) -> FileResponse:
        doc = get_object_or_404(Documentation, pk=pk)

        if not doc.file:
            raise Http404("Файл не найден")

        filename = os.path.basename(doc.file.name)

        return FileResponse(
            doc.file.open("rb"),
            as_attachment=True,
            filename=filename,
        )

class DocumentationBulkDownloadView(APIView):
    """
    View to serve multiple documentation files as a zip archive.
    """
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest, *args:Any, **kwargs: Any) -> HttpResponse:
        """
        Handle POST request to download multiple documents as a zip archive.
        """
        ids = request.data.get("ids", [])

        if not isinstance(ids, list) or not ids:
            return HttpResponse("Не переданы ids документов", status=400)

        documents_map = {
            doc.id: doc for doc in Documentation.objects.filter(id__in=ids)
        }
        ordered_documents = [documents_map[doc_id] for doc_id in ids if doc_id in documents_map]

        if not ordered_documents:
            raise Http404("Документы не найдены")

        zip_buffer = BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            used_names = set()

            for doc in ordered_documents:
                if not doc.file:
                    continue

                original_name = os.path.basename(doc.file.name)
                name, ext = os.path.splitext(original_name)

                safe_name = original_name
                counter = 1
                while safe_name in used_names:
                    safe_name = f"{name}_{counter}{ext}"
                    counter += 1

                used_names.add(safe_name)

                with doc.file.open("rb") as f:
                    zip_file.writestr(safe_name, f.read())

        zip_buffer.seek(0)

        response = HttpResponse(zip_buffer.getvalue(), content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="documents.zip"'
        return response

def doc_page(request: HttpRequest) -> HttpResponse:
    sections = {
        "Catalog Documentation": "swagger-catalog",
        "Logistic Documentation": "swagger-logistic",
        "Stock Documentation": "swagger-stock",
        "Contacts Documentation": "swagger-contacts",
        "Core Documentation": "swagger-core",
        "Full API Schema (JSON)": "schema-json",
    }

    docs = []

    for title, url_name in sections.items():
        try:
            docs.append({
                "title": title,
                "url": reverse(url_name),
            })
        except NoReverseMatch:
            continue

    return render(request, "core/docs_index.html", {"docs": docs})