from django.urls import path

from order.routes import OrderRoutes
from order.views.orders import OrderListCreateAPIView, OrderResourcesAPIView

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
]
