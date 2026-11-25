from core.api.routing import ApiRoute


class AdditionalServicesRoutes:
    LIST_CREATE = ApiRoute("", "additional_services_list_create")
    REPORT = ApiRoute("report/", "additional_services_report")
    DETAIL = ApiRoute("<int:pk>/", "additional_services_detail")
