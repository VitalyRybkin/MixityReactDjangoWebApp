from core.api.routing import ApiRoute


class ContactRoutes:
    LIST_CREATE = ApiRoute("", "contact_list_create")
    DETAIL = ApiRoute("<int:pk>/", "contact_detail")
