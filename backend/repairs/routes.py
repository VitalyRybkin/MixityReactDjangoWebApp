from core.api.routing import ApiRoute


class RepairsRoutes:
    """
    Routes for managing Repair resources.
    """

    LIST_CREATE = ApiRoute("repairs/", "repair_list_create")
    DETAIL = ApiRoute("repairs/<int:pk>/", "repair_detail")
    CONTACTS = ApiRoute("repairs/<int:pk>/contacts/", "repair_contacts")