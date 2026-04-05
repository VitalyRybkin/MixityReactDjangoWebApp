from django.urls import path

from order.routes import ClientRoutes, CustomerRoutes, ConstructionObjectsRoutes
from order.serializers.customer_serializers import CustomerObjectsSerializer
from order.views.clients import (
    ClientContactListAPIView,
    ClientListCreateAPIView,
    ClientRetrieveUpdateDestroyAPIView,
)
from order.views.customers import (
    CustomerContactListAPIView,
    CustomerListCreateAPIView,
    CustomerRetrieveUpdateDestroyAPIView, CustomerObjectsListCreateAPIView, CustomerObjectRetrieveUpdateDestroyAPIView,
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
    path(
        ClientRoutes.CONTACTS.path,
        ClientContactListAPIView.as_view(),
        name=ClientRoutes.CONTACTS.name,
    ),
    path(
        CustomerRoutes.LIST_CREATE.path,
        CustomerListCreateAPIView.as_view(),
        name=CustomerRoutes.LIST_CREATE.name,
    ),
    path(
        CustomerRoutes.DETAIL.path,
        CustomerRetrieveUpdateDestroyAPIView.as_view(),
        name=CustomerRoutes.DETAIL.name,
    ),
    path(
        CustomerRoutes.CONTACTS.path,
        CustomerContactListAPIView.as_view(),
        name=CustomerRoutes.CONTACTS.name,
    ),
    path(
        ConstructionObjectsRoutes.LIST_CREATE.path,
        CustomerObjectsListCreateAPIView.as_view(),
        name=ConstructionObjectsRoutes.LIST_CREATE.name,
    ),
    path(
        ConstructionObjectsRoutes.DETAIL.path,
        CustomerObjectRetrieveUpdateDestroyAPIView.as_view(),
        name=ConstructionObjectsRoutes.DETAIL.name,
    )
]
