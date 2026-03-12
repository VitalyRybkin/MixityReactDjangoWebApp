import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const carrierKeys = {
    all: ['carriers'],
    detail: (id) => ['carrier', String(id)],
    contacts: (id) => ['carrier', String(id), 'contacts'],
}

const fetchCarriers = async () => {
    const res = await api.get('/api/logistic/carriers/')
    return unwrapList(res.data)
}

const fetchCarrier = async (id) => {
    const res = await api.get(`/api/logistic/carriers/${id}/`)
    return res.data
}

const fetchCarrierContacts = async (id) => {
    const res = await api.get(`/api/logistic/carriers/${id}/contacts/`)
    return unwrapList(res.data)
}

const createCarrier = async (payload) => {
    const res = await api.post('/api/logistic/carriers/', payload)
    return res.data
}

const updateCarrier = async ({ id, payload }) => {
    const res = await api.patch(`/api/logistic/carriers/${id}/`, payload)
    return res.data
}

const deleteCarrier = async (id) => {
    await api.delete(`/api/logistic/carriers/${id}/`)
    return id
}

export function useGetCarriers() {
    return useQuery({
        queryKey: carrierKeys.all,
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
        },
    })
}
