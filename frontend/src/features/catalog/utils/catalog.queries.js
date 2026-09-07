import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

    salesPricesAll: (productId) => [...productKeys.detail(productId), 'sales-prices'],

    salesPrices: (productId, customerId, page) => [...productKeys.salesPricesAll(productId), String(customerId), page],

    purchasePricesAll: (productId) => [...productKeys.detail(productId), 'purchase-prices'],

    purchasePrices: (productId, warehouseId, page) => [
        ...productKeys.purchasePricesAll(productId),
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

export const createSalesPrice = async ({ productId, payload }) => {
    const res = await api.post(catalogApiPaths.salesPrices(productId), payload)

    return res.data
}

export const updateSalesPrice = async ({ id, payload }) => {
    const res = await api.patch(catalogApiPaths.salesPriceDetail(id), payload)

    return res.data
}

export const createPurchasePrice = async ({ productId, payload }) => {
    const res = await api.post(catalogApiPaths.purchasePrices(productId), payload)

    return res.data
}

export const updatePurchasePrice = async ({ id, payload }) => {
    const res = await api.patch(catalogApiPaths.purchasePriceDetail(id), payload)

    return res.data
}

export const deleteSalesPrice = async (id) => {
    await api.delete(catalogApiPaths.salesPriceDetail(id))
}

export const deletePurchasePrice = async (id) => {
    await api.delete(catalogApiPaths.purchasePriceDetail(id))
}

// --- QUERIES ---

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

export function useDeleteSalesPrice(productId) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteSalesPrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.salesPricesAll(productId),
            }),
    })
}

export function useDeletePurchasePrice(productId) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deletePurchasePrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.purchasePricesAll(productId),
            }),
    })
}

// --- MUTATIONS ---

export function useCreateSalesPrice(productId) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload) =>
            createSalesPrice({
                productId,
                payload,
            }),

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.salesPricesAll(productId),
            }),
    })
}

export function useUpdateSalesPrice(productId) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }) =>
            updateSalesPrice({
                id,
                payload,
            }),

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.salesPricesAll(productId),
            }),
    })
}

export function useCreatePurchasePrice(productId) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload) =>
            createPurchasePrice({
                productId,
                payload,
            }),

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.purchasePricesAll(productId),
            }),
    })
}

export function useUpdatePurchasePrice(productId) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }) =>
            updatePurchasePrice({
                id,
                payload,
            }),

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.purchasePricesAll(productId),
            }),
    })
}
