import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../api.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const warehouseKeys = {
    all: ['warehouses'],
    detail: (id) => ['warehouse', String(id)],
    contacts: (id) => ['warehouse', String(id), 'contacts'],
}

const fetchWarehouses = async () => {
    const res = await api.get('/api/stock/')
    return unwrapList(res.data)
}

const fetchWarehouse = async (id) => {
    const res = await api.get(`/api/stock/${id}/`)
    return res.data
}

const fetchWarehouseContacts = async (id) => {
    const res = await api.get(`/api/stock/${id}/contacts/`)
    return unwrapList(res.data)
}

const createWarehouse = async (payload) => {
    const res = await api.post('/api/stock/', payload)
    return res.data
}

const updateWarehouse = async ({ id, payload }) => {
    const res = await api.patch(`/api/stock/${id}/`, payload)
    return res.data
}

const deleteWarehouse = async (id) => {
    await api.delete(`/api/stock/${id}/`)
    return id
}

export function useWarehouses() {
    return useQuery({
        queryKey: warehouseKeys.all,
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
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
        },
    })
}

export function useUpdateWarehouse() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateWarehouse,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
            await queryClient.invalidateQueries({
                queryKey: warehouseKeys.detail(variables.id),
            })
        },
    })
}

export function useDeleteWarehouse() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteWarehouse,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
            queryClient.removeQueries({ queryKey: warehouseKeys.detail(id) })
            queryClient.removeQueries({ queryKey: warehouseKeys.contacts(id) })
        },
    })
}