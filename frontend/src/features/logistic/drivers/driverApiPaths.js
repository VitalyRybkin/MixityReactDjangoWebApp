export const driverApiPaths = {
    listCreate: () => '/api/logistic/drivers/',
    detail: (id) => `/api/logistic/drivers/${id}/`,
    carrierList: (carrierId) => `/api/logistic/carriers/${carrierId}/drivers/`,
}
