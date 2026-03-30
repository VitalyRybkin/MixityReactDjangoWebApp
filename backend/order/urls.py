from django.urls import path

from order.routes import ClientRoutes
from order.views.clients import (
    ClientListCreateAPIView,
    ClientRetrieveUpdateDestroyAPIView,
)

app_name = "order"

urlpatterns = [
    path(
        ClientRoutes.LIST_CREATE.path,
        ClientListCreateAPIView.as_view(),
        name=ClientRoutes.LIST_CREATE.name,
    ),
    path(
        ClientRoutes.DETAIL.path,
        ClientRetrieveUpdateDestroyAPIView.as_view(),
        name=ClientRoutes.DETAIL.name,
    ),
]
