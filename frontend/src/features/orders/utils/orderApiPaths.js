export const orderApiPaths = {
    listCreate: () => '/api/orders/',
    detail: (id) => `/api/orders/${id}/`,
    resources: () => `/api/orders/resources/`,
    download: () => `/api/orders/export/`,
    uploadUpd: (id) => `/api/orders/${id}/upload_upd/`,
    viewUpd: (id) => `/api/orders/${id}/upd/`,
}
