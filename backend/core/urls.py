from django.urls import path

from core.views import DocsListAPIView, doc_page, DocumentationDetailView

app_name = "core"

urlpatterns = [
    path("documentation/", DocsListAPIView.as_view(), name="documentation"),
    path("docs/<int:pk>/", DocumentationDetailView.as_view(), name="doc-detail"),
]