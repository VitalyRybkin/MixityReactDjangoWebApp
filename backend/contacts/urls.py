from django.urls import path

from contacts.views import ContactListCreateAPIView, ContactRetrieveUpdateAPIView

app_name = "contacts"

urlpatterns = [
    path("", ContactListCreateAPIView.as_view(), name="create_contact"),
    path("<int:pk>/", ContactRetrieveUpdateAPIView.as_view(), name="contact_details"),
]
