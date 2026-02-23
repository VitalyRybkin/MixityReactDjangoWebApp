from django.urls import include, path

urlpatterns = [
    path("api/contacts/", include("contacts.urls")),
]
