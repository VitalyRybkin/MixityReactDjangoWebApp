import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../api.js'

// --- API PATHS ---
export const customerApiPaths = {
    listCreate: () => '/api/orders/customers/',
    detail: (id) => `/api/orders/customers/${id}/`,
    contacts: (id) => `/api/orders/customers/${id}/contacts/`,
    construction_objects: (id) => `/api/orders/customers/${id}/construction_objects/`,
}

// --- UTILS ---
const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

// --- QUERY KEYS ---
export const customerKeys = {
    all: ['customer'], // Базовый ключ для всех запросов клиента
    list: () => [...customerKeys.all, 'list'],
    detail: (id) => [...customerKeys.all, 'detail', String(id)],
    contacts: (id) => [...customerKeys.all, 'detail', String(id), 'contacts'],
    objects: (id) => [...customerKeys.all, 'detail', String(id), 'objects'],
}

// --- API FUNCTIONS ---
export const fetchCustomers = async () => {
    const res = await api.get(customerApiPaths.listCreate())
    return unwrapList(res.data)
}

export const fetchCustomerDetail = async (id) => {
    const res = await api.get(customerApiPaths.detail(id))
    return res.data
}

export const fetchCustomerObjects = async (id) => {
    const res = await api.get(customerApiPaths.construction_objects(id))
    return unwrapList(res.data)
}

export const createCustomer = async (payload) => {
    const res = await api.post(customerApiPaths.listCreate(), payload)
    return res.data
}

export const updateCustomer = async ({ id, payload }) => {
    const res = await api.patch(customerApiPaths.detail(id), payload)
    return res.data
}

export const deleteCustomer = async (id) => {
    await api.delete(customerApiPaths.detail(id))
    return id
}

// --- HOOKS ---

export function useGetCustomers() {
    return useQuery({
        queryKey: customerKeys.list(),
        queryFn: fetchCustomers,
    })
}

export function useGetCustomer(id) {
    return useQuery({
        queryKey: customerKeys.detail(id),
        queryFn: () => fetchCustomerDetail(id),
        enabled: Boolean(id),
    })
}

export function useGetCustomerObjects(id) {
    return useQuery({
        queryKey: customerKeys.objects(id),
        queryFn: () => fetchCustomerObjects(id),
        enabled: Boolean(id),
    })
}

export function useCreateCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createCustomer,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: customerKeys.all })
        },
    })
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateCustomer,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: customerKeys.list() })
            await queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) })
        },
    })
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteCustomer,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: customerKeys.list() })
            queryClient.removeQueries({ queryKey: customerKeys.detail(id) })
        },
    })
}
