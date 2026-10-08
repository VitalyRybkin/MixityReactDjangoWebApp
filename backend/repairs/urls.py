from django.urls import path

from repairs.routes import RepairCompanyRoutes, RepairRequestRoutes
from repairs.views.repair_company_views import (
    RepairCompanyContactListCreateAPIView,
    RepairCompanyListCreateAPIView,
    RepairCompanyRetrieveUpdateDestroyAPIView,
)
from repairs.views.repair_request_views import RepairRequestListAPIView

app_name = "repairs"

urlpatterns = [
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
    path(
        RepairRequestRoutes.LIST_CREATE.path,
        RepairRequestListAPIView.as_view(),
        name=RepairRequestRoutes.LIST_CREATE.name,
    ),
    # path(
    #     RepairRequestRoutes.DETAIL.path,
    #     RepairRequestRetrieveUpdateDestroyAPIView.as_view(),
    #     name=RepairRequestRoutes.DETAIL.name,
    # ),
]
