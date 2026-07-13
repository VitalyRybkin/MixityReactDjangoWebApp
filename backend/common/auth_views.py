from drf_spectacular.utils import (
    OpenApiExample,
    extend_schema,
)
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class TokenObtainPairRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class TokenObtainPairResponseSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    access = serializers.CharField()


@extend_schema(
    tags=["Authentication"],
    summary="Obtain JWT token pair",
    description="Authenticate with username and password and receive access and refresh JWT tokens.",
    request=TokenObtainPairRequestSerializer,
    responses={
        200: TokenObtainPairResponseSerializer,
    },
    examples=[
        OpenApiExample(
            "Request",
            value={
                "username": "admin",
                "password": "password",
            },
            request_only=True,
        ),
        OpenApiExample(
            "Response",
            value={
                "refresh": "eyJhbGcOiJIUzI1NiIs...",
                "access": "eyJhbGcOiJIUzI1NiIs...",
            },
            response_only=True,
        ),
    ],
)
@extend_schema(
    tags=["Authentication"],
    summary="Obtain JWT token pair",
)
class CustomTokenObtainPairView(TokenObtainPairView):
    pass


@extend_schema(
    tags=["Authentication"],
    summary="Refresh JWT access token",
)
class CustomTokenRefreshView(TokenRefreshView):
    pass
