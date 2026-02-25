from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    # API
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/logistic/", include("logistic.urls")),
    path("api/catalog/", include("catalog.api.urls")),
    path("api/stock/", include("stock.urls")),
    path("api/contacts/", include("contacts.urls")),

    # DRF session login (optional, for browsable API)
    path("api/auth/", include("rest_framework.urls")),

    # Website
    path("", include("catalog.web.urls")),

    # Global
    path("api/schema/", SpectacularAPIView.as_view(permission_classes=[AllowAny]), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[AllowAny]), name="swagger-ui"),

    # Catalog-only OpenAPI
    path(
        "api/schema/catalog/",
        SpectacularAPIView.as_view(
            permission_classes=[AllowAny],
            urlconf="catalog.api.schema_urls",
        ),
        name="schema-catalog",
    ),
    path(
        "api/docs/catalog/",
        SpectacularSwaggerView.as_view(
            url_name="schema-catalog",
            permission_classes=[AllowAny],
        ),
        name="swagger-catalog",
    ),

    # Logistic-only OpenAPI
    path(
        "api/schema/logistic/",
        SpectacularAPIView.as_view(
            permission_classes=[AllowAny],
            urlconf="logistic.schema_urls",
        ),
        name="schema-logistic",
    ),
    path(
        "api/docs/logistic/",
        SpectacularSwaggerView.as_view(
            url_name="schema-logistic",
            permission_classes=[AllowAny],
        ),
        name="swagger-logistic",
    ),

  # Stock-only OpenAPI
  path(
      "api/schema/stock/",
      SpectacularAPIView.as_view(
          permission_classes=[AllowAny],
          urlconf="stock.schema_urls",
      ),
      name="schema-stock",
  ),
  path(
      "api/docs/stock/",
      SpectacularSwaggerView.as_view(
          url_name="schema-stock",
          permission_classes=[AllowAny],
      ),
      name="swagger-stock",
  ),

    # Contact-only OpenAPI
    path(
      "api/schema/contacts/",
      SpectacularAPIView.as_view(
          permission_classes=[AllowAny],
          urlconf="contacts.schema_urls",
      ),
      name="schema-contacts",
    ),
    path(
      "api/docs/contacts/",
      SpectacularSwaggerView.as_view(
          url_name="schema-contacts",
          permission_classes=[AllowAny],
      ),
      name="swagger-contacts",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
