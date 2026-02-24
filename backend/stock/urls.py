from django.urls import path

from contacts.views import WarehouseContactListAPIView
from stock.views.warehouses import (
    WarehouseListCreateAPIView,
    WarehouseRetrieveUpdateDestroyAPIView,
    WarehouseUploadMapAPIView,
)

app_name = "stock"

urlpatterns = [
    path(
        "",
        WarehouseListCreateAPIView.as_view(),
        name="warehouse_list_create",
    ),
    path(
        "<int:pk>/",
        WarehouseRetrieveUpdateDestroyAPIView.as_view(),
        name="warehouse_details",
    ),
    path(
        "<int:stock_pk>/contacts/",
        WarehouseContactListAPIView.as_view(),
        name="warehouse_contacts",
    ),
    path(
        "<int:pk>/map/",
        WarehouseUploadMapAPIView.as_view(),
        name="warehouse_map",
    ),
]
