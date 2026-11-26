from core.api.routing import ApiRoute


class AdditionalServicesRoutes:
    LIST_CREATE = ApiRoute("", "additional_services_list_create")
    PROVIDERS = ApiRoute("providers/", "additional_services_provider_options")
    DETAIL = ApiRoute("<int:pk>/", "additional_services_detail")
