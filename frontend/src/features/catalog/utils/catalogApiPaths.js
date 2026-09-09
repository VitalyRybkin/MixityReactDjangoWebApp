export const catalogApiPaths = {
    listCreate: () => '/api/catalog/products/',
    detail: (id) => `/api/catalog/products/${id}/`,

    salesPrices: () => '/api/catalog/sales-prices/',
    salesPriceDetail: (id) => `/api/catalog/sales-prices/${id}/`,

    purchasePrices: () => '/api/catalog/purchase-prices/',
    purchasePriceDetail: (id) => `/api/catalog/purchase-prices/${id}/`,
}
