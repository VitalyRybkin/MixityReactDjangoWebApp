from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from common.auth_views import CustomTokenRefreshView, CustomTokenObtainPairView
from common.views import doc_page


urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication
    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # API
    path("api/logistic/", include("logistic.urls")),
    path("api/catalog/", include("catalog.api.urls")),
    path("api/stocks/", include("stock.urls")),
    path("api/contacts/", include("contacts.urls")),
    path("api/common/", include("common.urls")),
    path("api/orders/", include("order.urls.clients")),
    path("api/orders/", include("order.urls.customers")),
    path("api/orders/", include("order.urls.orders")),
]


if settings.DEBUG:
    urlpatterns += [
        path(
            "",
            RedirectView.as_view(
                url="/api-docs/",
                permanent=False,
            ),
            name="development-home",
        ),
        path("api-docs/", doc_page, name="docs-home"),

        path("api/auth/", include("rest_framework.urls")),

        path(
            "api/schema/",
            SpectacularAPIView.as_view(
                permission_classes=[AllowAny],
            ),
            name="schema",
        ),
        path(
            "docs/",
            SpectacularSwaggerView.as_view(
                url_name="schema",
                permission_classes=[AllowAny],
            ),
            name="swagger-ui",
        ),

        # Authentication OpenAPI
        path(
            "api/schema/auth/",
            SpectacularAPIView.as_view(
                urlconf="common.schema_auth_urls",
                permission_classes=[AllowAny],
            ),
            name="schema-auth",
        ),
        path(
            "api/docs/auth/",
            SpectacularSwaggerView.as_view(
                url_name="schema-auth",
                permission_classes=[AllowAny],
            ),
            name="swagger-auth",
        ),

        # Catalog OpenAPI
        path(
            "api/schema/catalog/",
            SpectacularAPIView.as_view(
                urlconf="catalog.api.schema_urls",
                permission_classes=[AllowAny],
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

        # Logistic OpenAPI
        path(
            "api/schema/logistic/",
            SpectacularAPIView.as_view(
                urlconf="logistic.schema_urls",
                permission_classes=[AllowAny],
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

        # Stock OpenAPI
        path(
            "api/schema/stock/",
            SpectacularAPIView.as_view(
                urlconf="stock.schema_urls",
                permission_classes=[AllowAny],
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

        # Contacts OpenAPI
        path(
            "api/schema/contacts/",
            SpectacularAPIView.as_view(
                urlconf="contacts.schema_urls",
                permission_classes=[AllowAny],
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

        # Common OpenAPI
        path(
            "api/schema/common/",
            SpectacularAPIView.as_view(
                urlconf="common.schema_urls",
                permission_classes=[AllowAny],
            ),
            name="schema-common",
        ),
        path(
            "api/docs/common/",
            SpectacularSwaggerView.as_view(
                url_name="schema-common",
                permission_classes=[AllowAny],
            ),
            name="swagger-common",
        ),

        # Client OpenAPI
        path(
            "api/schema/client/",
            SpectacularAPIView.as_view(
                urlconf="order.schema_clients_urls",
                permission_classes=[AllowAny],
            ),
            name="schema-client",
        ),
        path(
            "api/docs/client/",
            SpectacularSwaggerView.as_view(
                url_name="schema-client",
                permission_classes=[AllowAny],
            ),
            name="swagger-client",
        ),

        # Customer OpenAPI
        path(
            "api/schema/customer/",
            SpectacularAPIView.as_view(
                urlconf="order.schema_customers_urls",
                permission_classes=[AllowAny],
            ),
            name="schema-customer",
        ),
        path(
            "api/docs/customer/",
            SpectacularSwaggerView.as_view(
                url_name="schema-customer",
                permission_classes=[AllowAny],
            ),
            name="swagger-customer",
        ),

        # Order OpenAPI
        path(
            "api/schema/orders/",
            SpectacularAPIView.as_view(
                urlconf="order.schema_orders_urls",
                permission_classes=[AllowAny],
            ),
            name="schema-order",
        ),
        path(
            "api/docs/orders/",
            SpectacularSwaggerView.as_view(
                url_name="schema-order",
                permission_classes=[AllowAny],
            ),
            name="swagger-order",
        ),
    ]

    urlpatterns += [
        path("", include("catalog.web.urls")),
    ]

    if settings.DEBUG:
        urlpatterns += static(
            settings.MEDIA_URL,
            document_root=settings.MEDIA_ROOT,
        )