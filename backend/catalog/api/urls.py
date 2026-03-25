from django.urls import path

from .routes import ProductRoutes, UnitRoutes
from .views.products import (
    ProductListCreateAPIView,
    ProductRetrieveUpdateDestroyAPIView,
)
from .views.units import UnitListCreateAPIView, UnitRetrieveUpdateDestroyAPIView

app_name = "catalog"

urlpatterns = [
    path(
        UnitRoutes.LIST_CREATE.path,
        UnitListCreateAPIView.as_view(),
        name=UnitRoutes.LIST_CREATE.name,
    ),
    path(
        UnitRoutes.DETAIL.path,
        UnitRetrieveUpdateDestroyAPIView.as_view(),
        name=UnitRoutes.DETAIL.name,
    ),
    path(
        ProductRoutes.LIST_CREATE.path,
        ProductListCreateAPIView.as_view(),
        name=ProductRoutes.LIST_CREATE.name,
    ),
    path(
        ProductRoutes.DETAIL.path,
        ProductRetrieveUpdateDestroyAPIView.as_view(),
        name=ProductRoutes.DETAIL.name,
    ),
]
