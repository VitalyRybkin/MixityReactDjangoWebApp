export const warehouseApiPaths = {
    listCreate: () => '/api/stocks/',
    detail: (id) => `/api/stocks/${id}/`,
    contacts: (id) => `/api/stocks/${id}/contacts/`,
    map: (id) => `/api/stocks/${id}/map/`,
    prices: (id) => `/api/stocks/${id}/prices/`,
}
