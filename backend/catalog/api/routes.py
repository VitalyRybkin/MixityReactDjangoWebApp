from core.api.routing import ApiRoute


class UnitRoutes:
    LIST_CREATE = ApiRoute("units/", "unit_list_create")
    DETAIL = ApiRoute("units/<int:pk>/", "unit_detail")


class ProductRoutes:
    LIST_CREATE = ApiRoute("products/", "product_list_create")
    DETAIL = ApiRoute("products/<int:pk>/", "product_detail")
