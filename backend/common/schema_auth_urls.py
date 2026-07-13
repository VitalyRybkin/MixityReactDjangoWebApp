from django.urls import path

from common.auth_views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
)

urlpatterns = [
    path(
        "api/auth/token/",
        CustomTokenObtainPairView.as_view(),
        name="schema-auth-token-obtain",
    ),
    path(
        "api/auth/token/refresh/",
        CustomTokenRefreshView.as_view(),
        name="schema-auth-token-refresh",
    ),
]
