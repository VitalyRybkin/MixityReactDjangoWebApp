export const carrierApiPaths = {
    listCreate: () => '/api/logistic/carriers/',
    detail: (id) => `/api/logistic/carriers/${id}/`,
    resources: (id) => `/api/logistic/carriers/${id}/resources/`,
    contacts: (id) => `/api/logistic/carriers/${id}/contacts/`,
    // trucks: (id) => `/api/logistic/carriers/${id}/trucks/`,
    // drivers: (id) => `/api/logistic/carriers/${id}/drivers/`,
}
