export const documentationApiPaths = {
    list: () => '/api/common/documentation/',
    detail: (id) => `/api/core/documentation/${id}/`,
    download: (id) => `/api/core/documentation/${id}/download/`,
    downloadZip: () => '/api/common/documentation/download-zip/',
}
