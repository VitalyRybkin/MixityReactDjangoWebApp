import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

import { carrierApiPaths } from './carrierApiPaths.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const carrierKeys = {
    all: ['carriers'],
    list: () => ['carriers', 'list'],
    detail: (id) => ['carriers', 'detail', String(id)],
    contacts: (id) => ['carriers', 'detail', String(id), 'contacts'],
    resources: (id) => ['carriers', 'detail', String(id), 'resources'],
    trucks: (id) => ['carriers', 'detail', String(id), 'trucks'],
    drivers: (id) => ['carriers', 'detail', String(id), 'drivers'],
}

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

// export const fetchCarrierResources = async (id) => {
//     const res = await api.get(carrierApiPaths.resources(id))
//     return res.data
// }
//
// export const fetchCarrierTrucks = async (id) => {
//     const res = await api.get(carrierApiPaths.trucks(id))
//     return unwrapList(res.data)
// }
//
// export const fetchCarrierDrivers = async (id) => {
//     const res = await api.get(carrierApiPaths.drivers(id))
//     return unwrapList(res.data)
// }

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

export function useCreateCarrier() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createCarrier,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: carrierKeys.all })
        },
    })
}

export function useUpdateCarrier() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateCarrier,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: carrierKeys.all })
            await queryClient.invalidateQueries({
                queryKey: carrierKeys.detail(variables.id),
            })
        },
    })
}

export function useDeleteCarrier() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteCarrier,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: carrierKeys.all })
            queryClient.removeQueries({ queryKey: carrierKeys.detail(id) })
            queryClient.removeQueries({ queryKey: carrierKeys.contacts(id) })
            queryClient.removeQueries({ queryKey: carrierKeys.resources(id) })
        },
    })
}
