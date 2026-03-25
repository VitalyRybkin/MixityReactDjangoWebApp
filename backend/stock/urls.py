from django.urls import path

from contacts.views import WarehouseContactListAPIView
from stock.routes import WarehouseRoutes
from stock.views.warehouses import (
    WarehouseListCreateAPIView,
    WarehouseRetrieveUpdateDestroyAPIView,
    WarehouseUploadMapAPIView,
)

app_name = "stock"

urlpatterns = [
    path(
        WarehouseRoutes.LIST_CREATE.path,
        WarehouseListCreateAPIView.as_view(),
        name=WarehouseRoutes.LIST_CREATE.name,
    ),
    path(
        WarehouseRoutes.DETAIL.path,
        WarehouseRetrieveUpdateDestroyAPIView.as_view(),
        name=WarehouseRoutes.DETAIL.name,
    ),
    path(
        WarehouseRoutes.CONTACTS.path,
        WarehouseContactListAPIView.as_view(),
        name=WarehouseRoutes.CONTACTS.name,
    ),
    path(
        WarehouseRoutes.MAP.path,
        WarehouseUploadMapAPIView.as_view(),
        name=WarehouseRoutes.MAP.name,
    ),
]
