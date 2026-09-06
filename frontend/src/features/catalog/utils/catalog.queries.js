// --- UTILS ---
import { useQuery } from '@tanstack/react-query'

import api from '../../../api.js'

import { catalogApiPaths } from './catalogApiPaths.js'

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

export const productKeys = {
    all: ['product'],
    list: () => [...productKeys.all, 'list'],
    detail: (id) => [...productKeys.all, 'detail', String(id)],
    salesPrices: (productId, customerId, page) => [
        ...productKeys.detail(productId),
        'sales-prices',
        String(customerId),
        page,
    ],
    purchasePrices: (productId, warehouseId, page) => [
        ...productKeys.detail(productId),
        'purchase-prices',
        String(warehouseId),
        page,
    ],
}

// --- API FUNCTIONS ---
export const fetchProducts = async () => {
    const res = await api.get(catalogApiPaths.listCreate())
    return unwrapList(res.data)
}

export const fetchProduct = async (id) => {
    const res = await api.get(catalogApiPaths.detail(id))
    return res.data
}

export const fetchSalesPrices = async ({ productId, customerId, page }) => {
    const res = await api.get(catalogApiPaths.salesPrices(productId), {
        params: {
            customer: customerId,
            page,
        },
    })

    return res.data
}

export const fetchPurchasePrices = async ({ productId, warehouseId, page }) => {
    const res = await api.get(catalogApiPaths.purchasePrices(productId), {
        params: {
            warehouse: warehouseId,
            page,
        },
    })
    return res.data
}

// --- HOOKS ---

export function useGetProducts() {
    return useQuery({
        queryKey: productKeys.list(),
        queryFn: fetchProducts,
    })
}

export function useGetProduct(id) {
    return useQuery({
        queryKey: productKeys.detail(id),
        queryFn: () => fetchProduct(id),
        enabled: Boolean(id),
    })
}

export function useGetSalesPrices(productId, customerId, page = 1) {
    return useQuery({
        queryKey: productKeys.salesPrices(productId, customerId, page),
        queryFn: () =>
            fetchSalesPrices({
                productId,
                customerId,
                page,
            }),
        enabled: Boolean(productId && customerId),
    })
}

export function useGetPurchasePrices(productId, warehouseId, page = 1) {
    return useQuery({
        queryKey: productKeys.purchasePrices(productId, warehouseId, page),
        queryFn: () =>
            fetchPurchasePrices({
                productId,
                warehouseId,
                page,
            }),
        enabled: Boolean(productId && warehouseId),
    })
}
