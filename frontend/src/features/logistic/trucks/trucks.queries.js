import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

import { truckApiPaths, truckCapacityApiPaths, truckTypeApiPaths } from './truckApiPaths.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const truckKeys = {
    all: ['trucks'],
    lists: () => ['trucks', 'list'],
    list: (carrierId) => ['trucks', 'list', 'carrier', String(carrierId)],
    detail: (id) => ['trucks', 'detail', String(id)],
}

export const truckCapacityKeys = {
    all: ['truck-capacities'],
    lists: () => ['truck-capacities', 'list'],
    detail: (id) => ['truck-capacities', 'detail', String(id)],
}

export const truckTypeKeys = {
    all: ['truck-types'],
    lists: () => ['truck-types', 'list'],
    detail: (id) => ['truck-types', 'detail', String(id)],
}

export const fetchCarrierTrucks = async (carrierId) => {
    const res = await api.get(truckApiPaths.carrierList(carrierId))
    return unwrapList(res.data)
}

const fetchTruck = async (id) => {
    const res = await api.get(truckApiPaths.detail(id))
    return res.data
}

const createTruck = async (payload) => {
    const res = await api.post(truckApiPaths.listCreate(), payload)
    return res.data
}

const updateTruck = async ({ id, payload }) => {
    const res = await api.patch(truckApiPaths.detail(id), payload)
    return res.data
}

const deleteTruck = async (id) => {
    await api.delete(truckApiPaths.detail(id))
    return id
}

const fetchTruckCapacities = async () => {
    const res = await api.get(truckCapacityApiPaths.listCreate())
    return unwrapList(res.data)
}

const fetchTruckCapacity = async (id) => {
    const res = await api.get(truckCapacityApiPaths.detail(id))
    return res.data
}

const createTruckCapacity = async (payload) => {
    const res = await api.post(truckCapacityApiPaths.listCreate(), payload)
    return res.data
}

const updateTruckCapacity = async ({ id, payload }) => {
    const res = await api.patch(truckCapacityApiPaths.detail(id), payload)
    return res.data
}

const fetchTruckTypes = async () => {
    const res = await api.get(truckTypeApiPaths.listCreate())
    return unwrapList(res.data)
}

const fetchTruckType = async (id) => {
    const res = await api.get(truckTypeApiPaths.detail(id))
    return res.data
}

const createTruckType = async (payload) => {
    const res = await api.post(truckTypeApiPaths.listCreate(), payload)
    return res.data
}

const updateTruckType = async ({ id, payload }) => {
    const res = await api.patch(truckTypeApiPaths.detail(id), payload)
    return res.data
}

export function useGetCarrierTrucks(carrierId) {
    return useQuery({
        queryKey: truckKeys.list(carrierId),
        queryFn: () => fetchCarrierTrucks(carrierId),
        enabled: Boolean(carrierId),
    })
}

export function useGetTruck(id) {
    return useQuery({
        queryKey: truckKeys.detail(id),
        queryFn: () => fetchTruck(id),
        enabled: Boolean(id),
    })
}

export function useCreateTruck() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createTruck,
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })

            const carrierId = data?.carrier ?? variables?.payload?.carrier
            if (carrierId) {
                await queryClient.invalidateQueries({
                    queryKey: truckKeys.list(carrierId),
                })
            }
        },
    })
}

export function useUpdateTruck() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateTruck,
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })
            await queryClient.invalidateQueries({
                queryKey: truckKeys.detail(variables.id),
            })

            const carrierId = data?.carrier ?? variables?.payload?.carrier
            if (carrierId) {
                await queryClient.invalidateQueries({
                    queryKey: truckKeys.list(carrierId),
                })
            }
        },
    })
}

export function useDeleteCarrierTruck() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteTruck,
        onSuccess: async (id, variables) => {
            await queryClient.invalidateQueries({ queryKey: truckKeys.all })
            queryClient.removeQueries({ queryKey: truckKeys.detail(id) })

            const carrierId = variables?.carrierId
            if (carrierId) {
                await queryClient.invalidateQueries({
                    queryKey: truckKeys.list(carrierId),
                })
            }
        },
    })
}

export function useGetTruckCapacities() {
    return useQuery({
        queryKey: truckCapacityKeys.lists(),
        queryFn: fetchTruckCapacities,
    })
}

export function useGetTruckCapacity(id) {
    return useQuery({
        queryKey: truckCapacityKeys.detail(id),
        queryFn: () => fetchTruckCapacity(id),
        enabled: Boolean(id),
    })
}

export function useCreateTruckCapacity() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createTruckCapacity,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: truckCapacityKeys.all })
        },
    })
}

export function useUpdateTruckCapacity() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateTruckCapacity,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: truckCapacityKeys.all })
            await queryClient.invalidateQueries({
                queryKey: truckCapacityKeys.detail(variables.id),
            })
        },
    })
}

export function useGetTruckTypes() {
    return useQuery({
        queryKey: truckTypeKeys.lists(),
        queryFn: fetchTruckTypes,
    })
}

export function useGetTruckType(id) {
    return useQuery({
        queryKey: truckTypeKeys.detail(id),
        queryFn: () => fetchTruckType(id),
        enabled: Boolean(id),
    })
}

export function useCreateTruckType() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createTruckType,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: truckTypeKeys.all })
        },
    })
}

export function useUpdateTruckType() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateTruckType,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: truckTypeKeys.all })
            await queryClient.invalidateQueries({
                queryKey: truckTypeKeys.detail(variables.id),
            })
        },
    })
}
