from django.urls import path

from stock.views.warehouses import WarehouseListCreateAPIView, WarehouseRetrieveUpdateDestroyAPIView

app_name = "stock"

urlpatterns = [
    path(
        "warehouse/",
        WarehouseListCreateAPIView.as_view(),
        name="warehouse_list_create",
    ),
    path(
        "warehouse/<int:pk>/",
        WarehouseRetrieveUpdateDestroyAPIView.as_view(),
        name="warehouse_details",
    ),
]