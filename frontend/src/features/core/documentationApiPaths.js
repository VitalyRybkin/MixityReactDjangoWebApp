export const documentationApiPaths = {
    list: () => '/api/core/documentation/',
    detail: (id) => `/api/core/documentation/${id}/`,
    download: (id) => `/api/core/documentation/${id}/download/`,
    downloadZip: () => '/api/core/documentation/download-zip/',
}
