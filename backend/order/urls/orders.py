from django.urls import path

from order.routes import OrderRoutes
from order.views.orders import (
    OrderListCreateAPIView,
    OrderResourcesAPIView,
    OrderRetrieveUpdateDestroyAPIView,
    OrdersDownloadAPIView,
    OrderUpdUploadAPIView,
    OrderUpdViewAPIView,
)

app_name = "order_orders"

urlpatterns = [
    path(
        OrderRoutes.LIST_CREATE.path,
        OrderListCreateAPIView.as_view(),
        name=OrderRoutes.LIST_CREATE.name,
    ),
    path(
        OrderRoutes.RESOURCES.path,
        OrderResourcesAPIView.as_view(),
        name=OrderRoutes.RESOURCES.name,
    ),
    path(
        OrderRoutes.DETAIL.path,
        OrderRetrieveUpdateDestroyAPIView.as_view(),
        name=OrderRoutes.DETAIL.name,
    ),
    path(
        OrderRoutes.DOWNLOAD.path,
        OrdersDownloadAPIView.as_view(),
        name=OrderRoutes.DOWNLOAD.name,
    ),
    path(
        OrderRoutes.UPLOAD_UPD.path,
        OrderUpdUploadAPIView.as_view(),
        name=OrderRoutes.UPLOAD_UPD.name,
    ),
    path(
        OrderRoutes.VIEW_UPD.path,
        OrderUpdViewAPIView.as_view(),
        name=OrderRoutes.VIEW_UPD.name,
    ),
]
