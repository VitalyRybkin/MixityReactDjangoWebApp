from django.urls import path

from catalog.api.views.products import (
    ProductListCreateAPIView,
    ProductRetrieveUpdateDestroyAPIView,
)
from catalog.api.views.units import (
    UnitListCreateAPIView,
    UnitRetrieveUpdateDestroyAPIView,
)

app_name = "catalog"

urlpatterns = [
    path(
        "unit/",
        UnitListCreateAPIView.as_view(),
        name="unit_list_create",
    ),
    path(
        "unit/<int:pk>/",
        UnitRetrieveUpdateDestroyAPIView.as_view(),
        name="unit_details",
    ),
    path(
        "product/",
        ProductListCreateAPIView.as_view(),
        name="product_list_create",
    ),
    path(
        "product/<int:pk>/",
        ProductRetrieveUpdateDestroyAPIView.as_view(),
        name="product_details",
    ),
]
