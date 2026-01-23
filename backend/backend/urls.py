import os

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView
from rest_framework.permissions import AllowAny

from backend import settings
from catalog.views import UserCreateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/user/register/", UserCreateView.as_view(), name="user_register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/auth/", include("rest_framework.urls")),
    path("api/", include("logistic.urls")),
    path(
      "api/schema/",
      SpectacularAPIView.as_view(permission_classes=[AllowAny]),
      name="schema",
    ),
    path(
      "docs/",
      SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[AllowAny]),
      name="swagger-ui",
    ),
    ]
