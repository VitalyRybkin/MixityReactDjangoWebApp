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
    all: ['order'],
    list: (dateFrom, dateTo) => [...orderKeys.all, 'list', { dateFrom, dateTo }],
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

export function useGetOrderResources() {
    return useQuery({
        queryKey: orderKeys.resources(),
        queryFn: fetchOrderResources,
    })
}

export function useGetOrders(filters = {}) {
    const { dateFrom = '', dateTo = '', status = '', customerId = '' } = filters

    return useQuery({
        queryKey: ['orders', dateFrom, dateTo, status, customerId],
        queryFn: () =>
            fetchOrders({
                dateFrom,
                dateTo,
                status,
                customerId,
            }),
    })
}

export function useGetOrder(id) {
    return useQuery({
        queryKey: orderKeys.detail(id),
        queryFn: () => fetchOrderDetail(id),
        enabled: Boolean(id),
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
            await queryClient.invalidateQueries({ queryKey: orderKeys.list() })
            await queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) })
        },
    })
}

export function useDeleteOrder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteOrder,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: orderKeys.list() })
            queryClient.removeQueries({ queryKey: orderKeys.detail(id) })
        },
    })
}
