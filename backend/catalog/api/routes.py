from core.api.routing import ApiRoute


class UnitRoutes:
    LIST_CREATE = ApiRoute("units/", "unit_list_create")
    DETAIL = ApiRoute("units/<int:pk>/", "unit_detail")


class ProductRoutes:
    LIST = ApiRoute("products/", "product_list")
    DETAIL = ApiRoute("products/<int:pk>/", "product_detail")

    PURCHASE_PRICES = ApiRoute(
        "purchase-prices/",
        "purchase_prices",
    )
    PURCHASE_PRICE_DETAIL = ApiRoute(
        "purchase-prices/<int:pk>/",
        "purchase_price_detail",
    )

    SALES_PRICES = ApiRoute(
        "sales-prices/",
        "sales_prices",
    )
    SALES_PRICE_DETAIL = ApiRoute(
        "sales-prices/<int:pk>/",
        "sales_price_detail",
    )
