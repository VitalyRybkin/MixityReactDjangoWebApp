from django.urls import path

from .routes import ProductRoutes, UnitRoutes
from .views.products import (
    ProductListAPIView,
    ProductPurchasePriceListAPIView,
    ProductRetrieveUpdateDestroyAPIView,
    ProductSalesPriceListAPIView,
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
        ProductRoutes.LIST.path,
        ProductListAPIView.as_view(),
        name=ProductRoutes.LIST.name,
    ),
    path(
        ProductRoutes.DETAIL.path,
        ProductRetrieveUpdateDestroyAPIView.as_view(),
        name=ProductRoutes.DETAIL.name,
    ),
    path(
        ProductRoutes.PRODUCT_PURCHASE_PRICES.path,
        ProductPurchasePriceListAPIView.as_view(),
        name=ProductRoutes.PRODUCT_PURCHASE_PRICES.name,
    ),
    path(
        ProductRoutes.PRODUCT_SALES_PRICES.path,
        ProductSalesPriceListAPIView.as_view(),
        name=ProductRoutes.PRODUCT_SALES_PRICES.name,
    ),
]
