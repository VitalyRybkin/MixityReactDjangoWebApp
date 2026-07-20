from django.urls import path

from common.auth_views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
)
from common.views import UserMeView

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
    path(
        "api/auth/user/me/",
        UserMeView.as_view(),
        name="current_user",
    ),
]
