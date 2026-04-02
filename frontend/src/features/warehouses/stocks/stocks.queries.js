import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'
import { warehouseApiPaths } from '../warehouseApiPaths.js'

// --- UTILS ---
const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    return []
}

// --- QUERY KEYS ---
export const warehouseKeys = {
    all: ['warehouses'],
    list: () => [...warehouseKeys.all, 'list'],
    detail: (id) => [...warehouseKeys.all, 'detail', String(id)],
    contacts: (id) => [...warehouseKeys.detail(id), 'contacts'],
}

// --- API FUNCTIONS ---
export const fetchWarehouses = async () => {
    const res = await api.get(warehouseApiPaths.listCreate())
    return unwrapList(res.data)
}

export const fetchWarehouse = async (id) => {
    const res = await api.get(warehouseApiPaths.detail(id))
    return res.data
}

export const fetchWarehouseContacts = async (id) => {
    const res = await api.get(warehouseApiPaths.contacts(id))
    return unwrapList(res.data)
}

export const createWarehouse = async (payload) => {
    const res = await api.post(warehouseApiPaths.listCreate(), payload)
    return res.data
}

export const updateWarehouse = async ({ id, payload }) => {
    const res = await api.patch(warehouseApiPaths.detail(id), payload)
    return res.data
}

export const deleteWarehouse = async (id) => {
    await api.delete(warehouseApiPaths.detail(id))
    return id
}

// --- HOOKS ---

export function useWarehouses() {
    return useQuery({
        queryKey: warehouseKeys.list(),
        queryFn: fetchWarehouses,
    })
}

export function useWarehouse(id) {
    return useQuery({
        queryKey: warehouseKeys.detail(id),
        queryFn: () => fetchWarehouse(id),
        enabled: Boolean(id),
    })
}

export function useWarehouseContacts(id) {
    return useQuery({
        queryKey: warehouseKeys.contacts(id),
        queryFn: () => fetchWarehouseContacts(id),
        enabled: Boolean(id),
    })
}

export function useCreateWarehouse() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createWarehouse,
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
        },
    })
}

export function useUpdateWarehouse() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateWarehouse,
        onSuccess: (_, variables) => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: warehouseKeys.list() }),
                queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.id) }),
            ])
        },
    })
}

export function useDeleteWarehouse() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteWarehouse,
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: warehouseKeys.detail(id) })
            return queryClient.invalidateQueries({ queryKey: warehouseKeys.list() })
        },
    })
}
