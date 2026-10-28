from core.api.routing import ApiRoute


class RepairCompanyRoutes:
    """
    Routes for managing Repair Company resources.
    """

    LIST_CREATE = ApiRoute("companies/", "repair_company_list_create")
    DETAIL = ApiRoute("companies/<int:pk>/", "repair_company_detail")
    CONTACTS = ApiRoute("companies/<int:pk>/contacts/", "repair_company_contacts")


class RepairRequestRoutes:
    """
    Routes for managing Repair Request resources.
    """

    LIST_CREATE = ApiRoute("requests/", "repair_request_list_create")
    DETAIL = ApiRoute("requests/<int:pk>/", "repair_request_detail")


class RepairPartRoutes:
    """
    Routes for managing Repair Part resources.
    """

    LIST_CREATE = ApiRoute("parts/", "repair_part_list_create")
    DETAIL = ApiRoute("parts/<int:pk>/", "repair_part_detail")


class RepairServiceRoutes:
    """
    Routes for managing Service resources.
    """

    LIST_CREATE = ApiRoute("services/", "service_list_create")
    DETAIL = ApiRoute("services/<int:pk>/", "service_detail")


class RepairFilesRoutes:
    """
    Routes for managing Repair Request Files resources.
    """

    LIST = ApiRoute("requests/<int:pk>/files/", "repair_files_list")
    LIST_CREATE_REQUEST = ApiRoute(
        "requests/<int:pk>/request_files/", "repair_request_files_create"
    )
    DELETE_REQUEST_FILE = ApiRoute(
        "requests/<int:pk>/request_files/<int:file_pk>/", "repair_request_files_delete"
    )
    LIST_CREATE_CLOSING = ApiRoute(
        "requests/<int:pk>/closing_files/", "repair_closing_files_create"
    )
    DELETE_CLOSING_FILE = ApiRoute(
        "requests/<int:pk>/closing_files/<int:file_pk>/", "repair_closing_files_delete"
    )
