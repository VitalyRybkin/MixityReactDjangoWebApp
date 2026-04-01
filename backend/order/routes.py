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
