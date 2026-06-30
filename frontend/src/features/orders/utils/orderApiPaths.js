export const orderApiPaths = {
    listCreate: () => '/api/orders/',
    detail: (id) => `/api/orders/${id}/`,
    resources: () => `/api/orders/resources/`,
    download: () => `/api/orders/download/`,
}
