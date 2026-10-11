export const repairCompaniesApiPaths = {
    listCreate: () => '/api/repair/companies/',
    detail: (id) => `/api/repair/companies/${id}/`,
    contacts: (id) => `/api/repair/companies/${id}/contacts/`,
}

export const repairRequestsApiPaths = {
    listCreate: () => '/api/repair/requests/',
    detail: (id) => `/api/repair/requests/${id}/`,
}
