from core.api.routing import ApiRoute


class UnitRoutes:
    LIST_CREATE = ApiRoute("units/", "unit_list_create")
    DETAIL = ApiRoute("units/<int:pk>/", "unit_detail")


class ProductRoutes:
    LIST = ApiRoute("products/", "product_list")
    DETAIL = ApiRoute("products/<int:pk>/", "product_detail")
