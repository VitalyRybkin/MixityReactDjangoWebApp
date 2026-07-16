from django.urls import path

from .routes import DocumentationRoutes, UserRoutes
from .views import (
    DocumentationBulkDownloadView,
    DocumentationDetailView,
    DocumentationDownloadView,
    DocumentsListAPIView, UserMeView,
)

app_name = "common"

urlpatterns = [
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
    path(UserRoutes.ME.path, UserMeView.as_view(), name=UserRoutes.ME.name,),
]
