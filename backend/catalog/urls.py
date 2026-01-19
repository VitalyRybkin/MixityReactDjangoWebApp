from django.urls import path

from catalog.views import (
    CustomerCreateView,
    CustomerDeleteView,
    CustomerDetailView,
    CustomerListView,
)

urlpatterns = [
    path("customers/", CustomerListView.as_view(), name="customer_list"),
    path("customers/create", CustomerCreateView.as_view(), name="customer_create"),
    path(
        "customers/<int:pk>/delete",
        CustomerDeleteView.as_view(),
        name="customer_delete",
    ),
    path(
        "customers/<int:pk>/detail",
        CustomerDetailView.as_view(),
        name="customer_detail",
    ),
]
