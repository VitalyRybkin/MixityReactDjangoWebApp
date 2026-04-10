from django.urls import path

from order.routes import ClientRoutes
from order.views.clients import (
    ClientContactListAPIView,
    ClientListCreateAPIView,
    ClientRetrieveUpdateDestroyAPIView,
)

app_name = "order_clients"

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
    path(
        ClientRoutes.CONTACTS.path,
        ClientContactListAPIView.as_view(),
        name=ClientRoutes.CONTACTS.name,
    ),
]
