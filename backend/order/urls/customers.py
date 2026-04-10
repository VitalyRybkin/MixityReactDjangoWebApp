from django.urls import path

from order.routes import ConstructionObjectsRoutes, CustomerRoutes
from order.views.customers import (
    CustomerContactListAPIView,
    CustomerListCreateAPIView,
    CustomerObjectRetrieveUpdateDestroyAPIView,
    CustomerObjectsListCreateAPIView,
    CustomerRetrieveUpdateDestroyAPIView,
)

app_name = "order_customers"

urlpatterns = [
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
    ),
]
