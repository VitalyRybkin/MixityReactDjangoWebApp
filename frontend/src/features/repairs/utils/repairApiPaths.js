export const repairCompaniesApiPaths = {
    listCreate: () => '/api/repair/companies/',
    detail: (id) => `/api/repair/companies/${id}/`,
    contacts: (id) => `/api/repair/companies/${id}/contacts/`,
}