from django.urls import path

from .routes import DocumentationRoutes
from .views import (
    DocumentationBulkDownloadView,
    DocumentationDetailView,
    DocumentationDownloadView,
    DocumentationSharedFileView,
    DocumentationShareLinksView,
    DocumentsListAPIView,
)

app_name = "common"

urlpatterns = [
    path(
        DocumentationRoutes.SHARE_LINKS.path,
        DocumentationShareLinksView.as_view(),
        name=DocumentationRoutes.SHARE_LINKS.name,
    ),
    path(
        DocumentationRoutes.SHARED_FILE.path,
        DocumentationSharedFileView.as_view(),
        name=DocumentationRoutes.SHARED_FILE.name,
    ),
    path(
        DocumentationRoutes.LIST.path,
        DocumentsListAPIView.as_view(),
        name=DocumentationRoutes.LIST.name,
    ),
    path(
        DocumentationRoutes.DETAIL.path,
        DocumentationDetailView.as_view(),
        name=DocumentationRoutes.DETAIL.name,
    ),
    path(
        DocumentationRoutes.DOWNLOAD.path,
        DocumentationDownloadView.as_view(),
        name=DocumentationRoutes.DOWNLOAD.name,
    ),
    path(
        DocumentationRoutes.DOWNLOAD_ZIP.path,
        DocumentationBulkDownloadView.as_view(),
        name=DocumentationRoutes.DOWNLOAD_ZIP.name,
    ),
]
