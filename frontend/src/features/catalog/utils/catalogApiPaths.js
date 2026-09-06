export const catalogApiPaths = {
    listCreate: () => '/api/catalog/products/',
    detail: (id) => `/api/catalog/products/${id}/`,

    salesPrices: (id) => `/api/catalog/products/${id}/sales-prices/`,
    purchasePrices: (id) => `/api/catalog/products/${id}/purchase-prices/`,
}
