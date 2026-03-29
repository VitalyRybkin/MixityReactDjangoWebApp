from core.api.routing import ApiRoute


class CarrierRoutes:
    LIST_CREATE = ApiRoute("carriers/", "carrier_list_create")
    DETAIL = ApiRoute("carriers/<int:pk>/", "carrier_detail")
    RESOURCES = ApiRoute("carriers/<int:pk>/resources/", "carrier_resources")
    CONTACTS = ApiRoute("carriers/<int:pk>/contacts/", "carrier_contacts")
    TRUCKS = ApiRoute("carriers/<int:pk>/trucks/", "carrier_trucks")
    DRIVERS = ApiRoute("carriers/<int:pk>/drivers/", "carrier_drivers")


class TruckRoutes:
    LIST_CREATE = ApiRoute("trucks/", "truck_list_create")
    DETAIL = ApiRoute("trucks/<int:pk>/", "truck_detail")


class TruckCapacityRoutes:
    LIST_CREATE = ApiRoute("truck_capacities/", "truck_capacity_list_create")
    DETAIL = ApiRoute("truck_capacities/<int:pk>/", "truck_capacity_detail")


class TruckTypeRoutes:
    LIST_CREATE = ApiRoute("truck_types/", "truck_type_list_create")
    DETAIL = ApiRoute("truck_types/<int:pk>/", "truck_type_detail")


class DriverRoutes:
    LIST_CREATE = ApiRoute("drivers/", "driver_list_create")
    DETAIL = ApiRoute("drivers/<int:pk>/", "driver_detail")
