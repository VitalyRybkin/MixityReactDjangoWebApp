export const customerApiPaths = {
    listCreate: () => '/api/orders/customers/',
    detail: (id) => `/api/orders/customers/${id}/`,
    contacts: (id) => `/api/orders/customers/${id}/contacts/`,
    construction_objects: (id) => `/api/orders/customers/${id}/construction_objects/`,
}
