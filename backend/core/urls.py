from django.urls import path

from .views import (
    DocsListAPIView,
    DocumentationDetailView,
    DocumentationDownloadView,
    DocumentationBulkDownloadView,
)

urlpatterns = [
    path("documentation/", DocsListAPIView.as_view(), name="docs-list"),
    path("documentation/<int:pk>/", DocumentationDetailView.as_view(), name="doc-detail"),
    path("documentation/<int:pk>/download/", DocumentationDownloadView.as_view(), name="doc-download"),
    path("documentation/download-zip/", DocumentationBulkDownloadView.as_view(), name="doc-download-zip"),
]