from django.urls import path

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
    path("<int:pk>/map/", WarehouseUploadMapAPIView.as_view(), name="warehouse_map"),
]
