export const customerApiPaths = {
    listCreate: () => '/api/orders/customers/',
    detail: (id) => `/api/orders/customers/${id}/`,
    contacts: (id) => `/api/orders/customers/${id}/contacts/`,
    prices: (id) => `/api/orders/customers/${id}/prices/`,
}

export const constructionObjectsApiPaths = {
    listCreate: (id) => `/api/orders/customers/${id}/construction_objects/`,
    detail: (id, objectId) => `/api/orders/customers/${id}/construction_objects/${objectId}/`,
}
