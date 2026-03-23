from django.shortcuts import render
from django.urls import reverse, NoReverseMatch
from rest_framework import generics
from rest_framework.permissions import AllowAny

from core.models import Documentation
from core.serializers import DocumentationSerializer


class DocsListAPIView(generics.ListAPIView):
    """
    API view to list all documents.
    """
    queryset = Documentation.objects.all()
    serializer_class = DocumentationSerializer
    permission_classes = [AllowAny]




def doc_page(request):
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