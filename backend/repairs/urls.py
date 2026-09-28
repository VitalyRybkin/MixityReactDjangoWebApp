from django.urls import path

from repairs.routes import RepairCompanyRoutes
from repairs.views.repair_company_views import (
    RepairCompanyContactListCreateAPIView,
    RepairCompanyListCreateAPIView,
    RepairCompanyRetrieveUpdateDestroyAPIView,
)

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
]
