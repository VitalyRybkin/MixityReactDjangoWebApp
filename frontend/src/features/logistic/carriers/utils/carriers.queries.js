import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../../api.js'

import { carrierApiPaths } from './carrierApiPaths.js'

// --- UTILS ---
const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    return []
}

// --- QUERY KEYS ---
export const carrierKeys = {
    all: ['carriers'],
    list: () => [...carrierKeys.all, 'list'],
    detail: (id) => [...carrierKeys.all, 'detail', String(id)],
    contacts: (id) => [...carrierKeys.detail(id), 'contacts'],
    resources: (id) => [...carrierKeys.detail(id), 'resources'],
    trucks: (id) => [...carrierKeys.detail(id), 'trucks'],
    drivers: (id) => [...carrierKeys.detail(id), 'drivers'],
}

// --- API FUNCTIONS ---
export const fetchCarriers = async () => {
    const res = await api.get(carrierApiPaths.listCreate())
    return unwrapList(res.data)
}

export const fetchCarrier = async (id) => {
    const res = await api.get(carrierApiPaths.detail(id))
    return res.data
}

export const fetchCarrierContacts = async (id) => {
    const res = await api.get(carrierApiPaths.contacts(id))
    return unwrapList(res.data)
}

export const fetchCarrierResources = async (id) => {
    if (!id) return { trucks: [], drivers: [] }
    const res = await api.get(carrierApiPaths.resources(id))
    return res.data
}

export const createCarrier = async (payload) => {
    const res = await api.post(carrierApiPaths.listCreate(), payload)
    return res.data
}

export const updateCarrier = async ({ id, payload }) => {
    const res = await api.patch(carrierApiPaths.detail(id), payload)
    return res.data
}

export const deleteCarrier = async (id) => {
    await api.delete(carrierApiPaths.detail(id))
    return id
}

// --- HOOKS ---

export function useGetCarriers() {
    return useQuery({
        queryKey: carrierKeys.list(),
        queryFn: fetchCarriers,
    })
}

export function useGetCarrier(id) {
    return useQuery({
        queryKey: carrierKeys.detail(id),
        queryFn: () => fetchCarrier(id),
        enabled: Boolean(id),
    })
}

export function useGetCarrierContacts(id) {
    return useQuery({
        queryKey: carrierKeys.contacts(id),
        queryFn: () => fetchCarrierContacts(id),
        enabled: Boolean(id),
    })
}

export function useGetCarrierResources(id) {
    return useQuery({
        queryKey: carrierKeys.resources(id),
        queryFn: () => fetchCarrierResources(id),
        enabled: Boolean(id),
    })
}

export function useCreateCarrier() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createCarrier,
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: carrierKeys.all })
        },
    })
}

export function useUpdateCarrier() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateCarrier,
        onSuccess: (_, variables) => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: carrierKeys.list() }),
                queryClient.invalidateQueries({ queryKey: carrierKeys.detail(variables.id) }),
            ])
        },
    })
}

export function useDeleteCarrier() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteCarrier,
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: carrierKeys.detail(id) })
            return queryClient.invalidateQueries({ queryKey: carrierKeys.list() })
        },
    })
}
