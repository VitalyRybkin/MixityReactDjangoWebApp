export const repairCompaniesApiPaths = {
    listCreate: () => '/api/repair/companies/',
    detail: (id) => `/api/repair/companies/${id}/`,
    contacts: (id) => `/api/repair/companies/${id}/contacts/`,
}

export const repairRequestsApiPaths = {
    listCreate: () => '/api/repair/requests/',
    detail: (id) => `/api/repair/requests/${id}/`,
}

export const repairRequestPartsApiPaths = {
    listCreate: () => `/api/repair/parts/`,
    detail: (id) => `/api/repair/parts/${id}/`,
}

export const repairRequestServicesApiPaths = {
    listCreate: () => `/api/repair/services/`,
    detail: (id) => `/api/repair/services/${id}/`,
}

export const repairFilesApiPaths = {
    list: (id) => `/api/repair/requests/${id}/files/`,
    requestFileListCreate: (id) => `/api/repair/requests/${id}/request_files/`,
    requestFileDetail: (id, fileId) => `/api/repair/requests/${id}/request_files/${fileId}/`,
    closingFileListCreate: (id) => `/api/repair/requests/${id}/closing_files/`,
    closingFileDetail: (id, fileId) => `/api/repair/requests/${id}/closing_files/${fileId}/`,
}
