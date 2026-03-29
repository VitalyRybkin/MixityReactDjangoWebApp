from core.api.routing import ApiRoute


class UnitRoutes:
    LIST_CREATE = ApiRoute("unit/", "unit_list_create")
    DETAIL = ApiRoute("unit/<int:pk>/", "unit_detail")


class ProductRoutes:
    LIST_CREATE = ApiRoute("product/", "product_list_create")
    DETAIL = ApiRoute("product/<int:pk>/", "product_detail")
