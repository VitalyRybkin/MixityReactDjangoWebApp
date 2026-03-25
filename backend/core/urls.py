from django.urls import path

from .routes import DocumentationRoutes
from .views import (
    DocumentsListAPIView,
    DocumentationDetailView,
    DocumentationDownloadView,
    DocumentationBulkDownloadView,
)

urlpatterns = [
    path(DocumentationRoutes.LIST.path, DocumentsListAPIView.as_view(), name=DocumentationRoutes.LIST.name,),
    path(DocumentationRoutes.DETAIL.path, DocumentationDetailView.as_view(), name=DocumentationRoutes.DETAIL.name,),
    path(DocumentationRoutes.DOWNLOAD.path, DocumentationDownloadView.as_view(), name=DocumentationRoutes.DOWNLOAD.name,),
    path(DocumentationRoutes.DOWNLOAD_ZIP.path, DocumentationBulkDownloadView.as_view(), name=DocumentationRoutes.DOWNLOAD_ZIP.name,),
]