from core.api.routing import ApiRoute


class RepairCompanyRoutes:
    """
    Routes for managing Repair Company resources.
    """

    LIST_CREATE = ApiRoute("companies/", "repair_company_list_create")
    DETAIL = ApiRoute("companies/<int:pk>/", "repair_company_detail")
    CONTACTS = ApiRoute("companies/<int:pk>/contacts/", "repair_company_contacts")
