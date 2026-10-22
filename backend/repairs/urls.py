from django.urls import path

from repairs.routes import (
    RepairCompanyRoutes,
    RepairFilesRoutes,
    RepairPartRoutes,
    RepairRequestRoutes,
)
from repairs.views.repair_company_views import (
    RepairCompanyContactListCreateAPIView,
    RepairCompanyListCreateAPIView,
    RepairCompanyRetrieveUpdateDestroyAPIView,
)
from repairs.views.repair_file_views import (
    RepairClosingFileListCreateAPIView,
    RepairClosingFileRetrieveUpdateDestroyAPIView,
    RepairFilesListAPIView,
    RepairRequestFileListCreateAPIView,
    RepairRequestFileRetrieveUpdateDestroyAPIView,
)
from repairs.views.repair_request_views import (
    RepairPartsListAPIView,
    RepairPartsRetrieveUpdateDestroyAPIView,
    RepairRequestListAPIView,
    RepairRequestRetrieveUpdateDestroyAPIView,
)

app_name = "repairs"

urlpatterns = [
    # Company
    path(
        RepairCompanyRoutes.LIST_CREATE.path,
        RepairCompanyListCreateAPIView.as_view(),
        name=RepairCompanyRoutes.LIST_CREATE.name,
    ),
    path(
        RepairCompanyRoutes.DETAIL.path,
        RepairCompanyRetrieveUpdateDestroyAPIView.as_view(),
        name=RepairCompanyRoutes.DETAIL.name,
    ),
    path(
        RepairCompanyRoutes.CONTACTS.path,
        RepairCompanyContactListCreateAPIView.as_view(),
        name=RepairCompanyRoutes.CONTACTS.name,
    ),
    # Request
    path(
        RepairRequestRoutes.LIST_CREATE.path,
        RepairRequestListAPIView.as_view(),
        name=RepairRequestRoutes.LIST_CREATE.name,
    ),
    path(
        RepairRequestRoutes.DETAIL.path,
        RepairRequestRetrieveUpdateDestroyAPIView.as_view(),
        name=RepairRequestRoutes.DETAIL.name,
    ),
    # Part
    path(
        RepairPartRoutes.LIST_CREATE.path,
        RepairPartsListAPIView.as_view(),
        name=RepairPartRoutes.LIST_CREATE.name,
    ),
    path(
        RepairPartRoutes.DETAIL.path,
        RepairPartsRetrieveUpdateDestroyAPIView.as_view(),
        name=RepairPartRoutes.DETAIL.name,
    ),
    # File
    path(
        RepairFilesRoutes.LIST.path,
        RepairFilesListAPIView.as_view(),
        name=RepairFilesRoutes.LIST.name,
    ),
    path(
        RepairFilesRoutes.LIST_CREATE_REQUEST.path,
        RepairRequestFileListCreateAPIView.as_view(),
        name=RepairFilesRoutes.LIST_CREATE_REQUEST.name,
    ),
    path(
        RepairFilesRoutes.DELETE_REQUEST_FILE.path,
        RepairRequestFileRetrieveUpdateDestroyAPIView.as_view(),
        name=RepairFilesRoutes.DELETE_REQUEST_FILE.name,
    ),
    path(
        RepairFilesRoutes.LIST_CREATE_CLOSING.path,
        RepairClosingFileListCreateAPIView.as_view(),
        name=RepairFilesRoutes.LIST_CREATE_CLOSING.name,
    ),
    path(
        RepairFilesRoutes.DELETE_CLOSING_FILE.path,
        RepairClosingFileRetrieveUpdateDestroyAPIView.as_view(),
        name=RepairFilesRoutes.DELETE_CLOSING_FILE.name,
    ),
]
