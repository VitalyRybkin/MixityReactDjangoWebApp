import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../api.js'

import { orderApiPaths } from './orderApiPaths.js'

// --- UTILS ---
const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

// --- QUERY KEYS ---
export const orderKeys = {
    all: ['orders'],
    lists: () => [...orderKeys.all, 'list'],
    list: (filters = {}) => [
        ...orderKeys.lists(),
        {
            dateFrom: filters.dateFrom || '',
            dateTo: filters.dateTo || '',
            status: filters.status || '',
            customerId: filters.customerId || '',
        },
    ],
    detail: (id) => [...orderKeys.all, 'detail', String(id)],
    resources: () => [...orderKeys.all, 'resources'],
}

// --- API FUNCTIONS ---

export const fetchOrderResources = async () => {
    const res = await api.get(orderApiPaths.resources())
    return res.data
}

export const fetchOrders = async ({ dateFrom, dateTo, status, customerId } = {}) => {
    const params = {}

    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    if (status) params.status = status
    if (customerId) params.customer = customerId

    const res = await api.get(orderApiPaths.listCreate(), { params })
    return unwrapList(res.data)
}

export const fetchOrderDetail = async (id) => {
    const res = await api.get(orderApiPaths.detail(id))
    return res.data
}

export const createOrder = async (payload) => {
    const res = await api.post(orderApiPaths.listCreate(), payload)
    return res.data
}

export const updateOrder = async ({ id, payload }) => {
    const res = await api.patch(orderApiPaths.detail(id), payload)
    return res.data
}

export const deleteOrder = async (id) => {
    await api.delete(orderApiPaths.detail(id))
    return id
}

// --- HOOKS ---

export function useGetOrderResources(options = {}) {
    return useQuery({
        queryKey: orderKeys.resources(),
        queryFn: fetchOrderResources,
        ...options,
    })
}

export function useGetOrders(filters = {}) {
    return useQuery({
        queryKey: orderKeys.list(filters),
        queryFn: () =>
            fetchOrders({
                dateFrom: filters.dateFrom || '',
                dateTo: filters.dateTo || '',
                status: filters.status || '',
                customerId: filters.customerId || '',
            }),
    })
}

export function useGetOrder(id, options = {}) {
    return useQuery({
        queryKey: orderKeys.detail(id),
        queryFn: () => fetchOrderDetail(id),
        ...options,
        enabled: Boolean(id) && options.enabled !== false,
    })
}

export function useCreateOrder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createOrder,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: orderKeys.all })
        },
    })
}

export function useUpdateOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateOrder,

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: orderKeys.lists(),
            })

            await queryClient.invalidateQueries({
                queryKey: orderKeys.detail(variables.id),
            })
        },
    })
}

export function useDeleteOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteOrder,

        onSuccess: async (_, id) => {
            await queryClient.invalidateQueries({
                queryKey: orderKeys.lists(),
            })

            queryClient.removeQueries({
                queryKey: orderKeys.detail(id),
            })
        },
    })
}
