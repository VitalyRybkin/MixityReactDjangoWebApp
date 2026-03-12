import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'
import { carrierKeys } from '../carriers/carriers.queries.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const truckKeys = {
    all: ['trucks'],
    list: (id) => ['carrier', String(id), 'trucks'],
    detail: (id) => ['truck', String(id)],
}

export const fetchCarrierTrucks = async (id) => {
    const res = await api.get(`/api/logistic/carriers/${id}/trucks/`)
    return unwrapList(res.data)
}

const deleteTruck = async (id) => {
    await api.delete(`/api/logistic/trucks/${id}/`)
    return id
}

const fetchTruckCapacity = async (id) => {
    const res = await api.get(`/api/logistic/truck_capacities/${id}/`)
    return res.data
}

const createTruckCapacity = async (payload) => {
    const res = await api.post('/api/logistic/truck_capacities/', payload)
}

const updateTruckCapacity = async ({ id, payload }) => {
    const res = await api.patch(`/api/logistic/truck_capacities/${id}/`, payload)
    return res.data
}

const fetchTruckType = async (id) => {
    const res = await api.get(`/api/logistic/truck_types/${id}/`)
    return res.data
}

const createTruckType = async (payload) => {
    const res = await api.post('/api/logistic/truck_types/', payload)
}

const updateTruckType = async ({ id, payload }) => {
    const res = await api.patch(`/api/logistic/truck_types/${id}/`, payload)
    return res.data
}

export function useGetCarrierTrucks(id) {
    return useQuery({
        queryKey: truckKeys.list(id),
        queryFn: () => fetchCarrierTrucks(id),
        enabled: Boolean(id),
    })
}

export function useDeleteCarrierTruck() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteTruck,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })
            queryClient.removeQueries({ queryKey: truckKeys.detail(id) })
        },
    })
}

export function useGetTruckCapacity(id) {
    return useQuery({
        queryKey: truckKeys.detail(id),
        queryFn: () => fetchTruckCapacity(id),
        enabled: Boolean(id),
    })
}

export function useCreateTruckCapacity() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createTruckCapacity,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })
        },
    })
}

export function useUpdateTruckCapacity() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateTruckCapacity,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })
            await queryClient.invalidateQueries({
                queryKey: truckKeys.detail(variables.id),
            })
        },
    })
}

export function useGetTruckType(id) {
    return useQuery({
        queryKey: truckKeys.detail(id),
        queryFn: () => fetchTruckType(id),
        enabled: Boolean(id),
    })
}

export function useCreateTruckType() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createTruckType,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })
        },
    })
}

export function useUpdateTruckType() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateTruckType,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })
            await queryClient.invalidateQueries({
                queryKey: truckKeys.detail(variables.id),
            })
        },
    })
}
