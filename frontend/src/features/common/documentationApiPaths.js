export const documentationApiPaths = {
    list: () => '/api/common/documentation/',
    detail: (id) => `/api/common/documentation/${id}/`,
    download: (id) => `/api/common/documentation/${id}/download/`,
    downloadZip: () => '/api/common/documentation/download-zip/',
    shareLinks: () => '/api/common/documentation/share-links/',
}

export const userApiPaths = {
    me: () => '/api/auth/user/me/',
}
