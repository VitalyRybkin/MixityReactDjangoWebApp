import os

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf.urls.static import static

from backend import settings
from catalog.views import UserCreateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/user/register/", UserCreateView.as_view(), name="user_register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/auth/", include("rest_framework.urls")),
    path("api/", include("carrier.urls")),
    path("docs/", TemplateView.as_view(template_name="swagger-ui.html"), name="swagger-ui"),
    path("swagger/<path:path>", serve, {"document_root": os.path.join(settings.BASE_DIR, "swagger")}),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
