from django.urls import path

from core.views import DocsListAPIView

app_name = "core"

urlpatterns = [
    path("docs", DocsListAPIView.as_view(), name="docs")
]