from core.api.routing import ApiRoute


class AdditionalServicesRoutes:
    LIST_CREATE = ApiRoute("", "additional_services_list_create")
    PROVIDERS = ApiRoute("providers/", "additional_services_provider_options")
    SERVICES = ApiRoute("services/", "additional_services_repair_services")
    TRANSPORT_SERVICES = ApiRoute(
        "transport-services/", "additional_services_transport_services"
    )
    DETAIL = ApiRoute("<int:pk>/", "additional_services_detail")
