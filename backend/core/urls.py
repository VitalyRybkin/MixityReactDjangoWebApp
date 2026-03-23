from django.urls import path

from core.views import DocsListAPIView, doc_page

app_name = "core"

urlpatterns = [
    path("documentation/", DocsListAPIView.as_view(), name="documentation"),
]