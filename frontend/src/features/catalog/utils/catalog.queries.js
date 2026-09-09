import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

import { catalogApiPaths } from './catalogApiPaths.js'

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

export const productKeys = {
    all: ['products'],
    list: () => [...productKeys.all, 'list'],
    detail: (id) => [...productKeys.all, 'detail', id],
    salesPricesAll: () => ['sales-prices'],
    salesPrices: (customerId, page) => [...productKeys.salesPricesAll(), customerId, page],
    purchasePricesAll: () => ['purchase-prices'],
    purchasePrices: (warehouseId, page) => [...productKeys.purchasePricesAll(), warehouseId, page],
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

export const getSalesPrices = async ({ customerId, page }) => {
    const res = await api.get(catalogApiPaths.salesPrices(), {
        params: {
            customer: customerId,
            page,
        },
    })
    return res.data
}

export const getPurchasePrices = async ({ warehouseId, page }) => {
    const res = await api.get(catalogApiPaths.purchasePrices(), {
        params: {
            warehouse: warehouseId,
            page,
        },
    })
    return res.data
}

export const createSalesPrice = async (payload) => {
    const res = await api.post(catalogApiPaths.salesPrices(), payload)
    return res.data
}

export const updateSalesPrice = async ({ id, payload }) => {
    const res = await api.patch(catalogApiPaths.salesPriceDetail(id), payload)
    return res.data
}

export const createPurchasePrice = async (payload) => {
    const res = await api.post(catalogApiPaths.purchasePrices(), payload)
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

export function useGetSalesPrices(customerId, page = 1) {
    return useQuery({
        queryKey: productKeys.salesPrices(customerId, page),

        queryFn: () =>
            getSalesPrices({
                customerId,
                page,
            }),

        enabled: Boolean(customerId),
    })
}

export function useGetPurchasePrices(warehouseId, page = 1) {
    return useQuery({
        queryKey: productKeys.purchasePrices(warehouseId, page),
        queryFn: () =>
            getPurchasePrices({
                warehouseId,
                page,
            }),
        enabled: Boolean(warehouseId),
    })
}

export function useDeleteSalesPrice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteSalesPrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.salesPricesAll(),
            }),
    })
}

export function useDeletePurchasePrice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deletePurchasePrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.purchasePricesAll(),
            }),
    })
}

// --- MUTATIONS ---

export function useCreateSalesPrice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createSalesPrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.salesPricesAll(),
            }),
    })
}

export function useUpdateSalesPrice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateSalesPrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.salesPricesAll(),
            }),
    })
}

export function useCreatePurchasePrice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createPurchasePrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.purchasePricesAll(),
            }),
    })
}

export function useUpdatePurchasePrice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updatePurchasePrice,

        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: productKeys.purchasePricesAll(),
            }),
    })
}
