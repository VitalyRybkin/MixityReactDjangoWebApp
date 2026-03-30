from core.api.routing import ApiRoute


class ClientRoutes(ApiRoute):
    """
    Routes for managing Client resources.
    """

    LIST_CREATE = ApiRoute(
        "clients/",
        "client_list_create",
    )
    DETAIL = ApiRoute(
        "clients/<int:pk>/",
        "client_detail",
    )
