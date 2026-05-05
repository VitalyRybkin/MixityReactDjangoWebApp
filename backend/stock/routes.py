from core.api.routing import ApiRoute


class WarehouseRoutes:
    LIST_CREATE = ApiRoute("", "warehouse_list_create")
    DETAIL = ApiRoute("<int:pk>/", "warehouse_detail")
    CONTACTS = ApiRoute("<int:pk>/contacts/", "warehouse_contacts")
    MAP = ApiRoute("<int:pk>/map/", "warehouse_map")
    PRICES = ApiRoute("<int:pk>/prices/", "warehouse_prices")
