from django.urls import path

from contacts.views import ContactCreateAPIView, ContactRetrieveUpdateAPIView

app_name = "contacts"

urlpatterns = [
    path("", ContactCreateAPIView.as_view(), name="create_contact"),
    path("<int:pk>/", ContactRetrieveUpdateAPIView.as_view(), name="contact_details"),
]
