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
    list: () => [...orderKeys.all, 'list'],
    detail: (id) => [...orderKeys.all, 'detail', String(id)],
    resources: (id) => [...orderKeys.all, 'detail', String(id), 'resources'],
}

// --- API FUNCTIONS ---

export const fetchOrderResources = async () => {
    const res = await api.get(orderApiPaths.resources())
    return res.data
}

export const fetchOrders = async () => {
    const res = await api.get(orderApiPaths.listCreate())
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

export function useGetOrders() {
    return useQuery({
        queryKey: orderKeys.list(),
        queryFn: fetchOrders,
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
