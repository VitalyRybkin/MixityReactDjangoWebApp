from django.urls import path

from order.routes import OrderRoutes
from order.views.orders import OrderResourcesAPIView

app_name = "order_orders"

urlpatterns = [
    path(
        OrderRoutes.RESOURCES.path,
        OrderResourcesAPIView.as_view(),
        name=OrderRoutes.RESOURCES.name,
    ),
]
