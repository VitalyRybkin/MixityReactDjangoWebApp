from django.urls import path

from contacts.views import ContactListCreateAPIView, ContactRetrieveUpdateAPIView

from .routes import ContactRoutes

app_name = "contacts"

urlpatterns = [
    path(
        ContactRoutes.LIST_CREATE.path,
        ContactListCreateAPIView.as_view(),
        name=ContactRoutes.LIST_CREATE.name,
    ),
    path(
        ContactRoutes.DETAIL.path,
        ContactRetrieveUpdateAPIView.as_view(),
        name=ContactRoutes.DETAIL.name,
    ),
]
