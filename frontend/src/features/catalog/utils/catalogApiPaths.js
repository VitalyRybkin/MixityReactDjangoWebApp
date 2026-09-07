export const catalogApiPaths = {
    listCreate: () => '/api/catalog/products/',
    detail: (id) => `/api/catalog/products/${id}/`,

    salesPrices: (productId) => `/api/catalog/products/${productId}/sales-prices/`,

    salesPriceDetail: (id) => `/api/catalog/sales-prices/${id}/`,

    purchasePrices: (productId) => `/api/catalog/products/${productId}/purchase-prices/`,

    purchasePriceDetail: (id) => `/api/catalog/purchase-prices/${id}/`,
}
