export const truckApiPaths = {
    listCreate: () => '/api/logistic/trucks/',
    detail: (id) => `/api/logistic/trucks/${id}/`,
    carrierList: (carrierId) => `/api/logistic/carriers/${carrierId}/trucks/`,
}

export const truckCapacityApiPaths = {
    listCreate: () => '/api/logistic/truck_capacities/',
    detail: (id) => `/api/logistic/truck_capacities/${id}/`,
}

export const truckTypeApiPaths = {
    listCreate: () => '/api/logistic/truck_types/',
    detail: (id) => `/api/logistic/truck_types/${id}/`,
}
