from django.urls import path

from .routes import ProductRoutes, QualityPassportRoutes, UnitRoutes
from .views.products import (
    ProductListAPIView,
    ProductPurchasePriceListCreateAPIView,
    ProductPurchasePriceRetrieveUpdateDestroyAPIView,
    ProductRetrieveUpdateDestroyAPIView,
    ProductSalesPriceListCreateAPIView,
    ProductSalesPriceRetrieveUpdateDestroyAPIView,
)
from .views.quality_passports import (
    ProductSpecificationDetailAPIView,
    QualityPassportRetrieveUpdateDestroyAPIView,
    QualityPassportStateAPIView,
)
from .views.units import UnitListCreateAPIView, UnitRetrieveUpdateDestroyAPIView

app_name = "catalog"

urlpatterns = [
    # Unit routes
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
    # Product routes
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
        ProductRoutes.PURCHASE_PRICE_DETAIL.path,
        ProductPurchasePriceRetrieveUpdateDestroyAPIView.as_view(),
        name=ProductRoutes.PURCHASE_PRICE_DETAIL.name,
    ),
    path(
        ProductRoutes.PRODUCT_SALES_PRICES.path,
        ProductSalesPriceListCreateAPIView.as_view(),
        name=ProductRoutes.PRODUCT_SALES_PRICES.name,
    ),
    path(
        ProductRoutes.SALES_PRICE_DETAIL.path,
        ProductSalesPriceRetrieveUpdateDestroyAPIView.as_view(),
        name=ProductRoutes.SALES_PRICE_DETAIL.name,
    ),
    path(
        ProductRoutes.SPECIFICATION.path,
        ProductSpecificationDetailAPIView.as_view(),
        name=ProductRoutes.SPECIFICATION.name,
    ),
    # Quality passport routes
    path(
        QualityPassportRoutes.DETAIL.path,
        QualityPassportRetrieveUpdateDestroyAPIView.as_view(),
        name=QualityPassportRoutes.DETAIL.name,
    ),
    path(
        QualityPassportRoutes.STATE.path,
        QualityPassportStateAPIView.as_view(),
        name=QualityPassportRoutes.STATE.name,
    ),
]
