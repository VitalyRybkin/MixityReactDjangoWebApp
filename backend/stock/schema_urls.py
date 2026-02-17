from django.urls import include, path

urlpatterns = [
    path("api/stock/", include("stock.urls")),
]
