from django.urls import path

from .routes import ProductRoutes, UnitRoutes
from .views.products import (
    ProductListAPIView,
    ProductPurchasePriceListCreateAPIView,
    ProductPurchasePriceRetrieveUpdateDestroyAPIView,
    ProductRetrieveUpdateDestroyAPIView,
    ProductSalesPriceListCreateAPIView,
    ProductSalesPriceRetrieveUpdateDestroyAPIView,
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
        ProductPurchasePriceListCreateAPIView.as_view(),
        name=ProductRoutes.PRODUCT_PURCHASE_PRICES.name,
    ),
    path(
        ProductRoutes.PRODUCT_SALES_PRICES.path,
        ProductSalesPriceListCreateAPIView.as_view(),
        name=ProductRoutes.PRODUCT_SALES_PRICES.name,
    ),
    path(
        ProductRoutes.PURCHASE_PRICE_DETAIL.path,
        ProductPurchasePriceRetrieveUpdateDestroyAPIView.as_view(),
        name=ProductRoutes.PURCHASE_PRICE_DETAIL.name,
    ),
    path(
        ProductRoutes.SALES_PRICE_DETAIL.path,
        ProductSalesPriceRetrieveUpdateDestroyAPIView.as_view(),
        name=ProductRoutes.SALES_PRICE_DETAIL.name,
    ),
]
