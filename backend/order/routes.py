from core.api.routing import ApiRoute


class ClientRoutes:
    """
    Routes for managing Client resources.
    """

    LIST_CREATE = ApiRoute("clients/", "client_list_create")
    DETAIL = ApiRoute("clients/<int:pk>/", "client_detail")
    CONTACTS = ApiRoute("clients/<int:pk>/contacts/", "client_contacts")


class CustomerRoutes:
    """
    Routes for managing Customer resources.
    """

    LIST_CREATE = ApiRoute("customers/", "customer_list_create")
    DETAIL = ApiRoute("customers/<int:pk>/", "customer_detail")
    CONTACTS = ApiRoute("customers/<int:pk>/contacts/", "customer_contacts")
    CONSTRUCTIONS = ApiRoute(
        "customers/<int:pk>/constructions/", "customer_constructions"
    )
    PRICES = ApiRoute("customers/<int:pk>/prices/", "customer_prices")


class ConstructionObjectsRoutes:
    """
    Routes for managing Construction objects associated with Customers.
    """

    LIST_CREATE = ApiRoute(
        "customers/<int:pk>/construction_objects/", "customer_objects_list_create"
    )
    DETAIL = ApiRoute(
        "customers/<int:pk>/construction_objects/<int:object_pk>/",
        "customer_object_detail",
    )


class OrderRoutes:
    LIST_CREATE = ApiRoute("", "order_list_create")
    DETAIL = ApiRoute("<int:pk>/", "order_detail")
    RESOURCES = ApiRoute("resources/", "order_resources")
    DOWNLOAD = ApiRoute("download/", "orders_download")
