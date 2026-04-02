import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

import { truckApiPaths, truckCapacityApiPaths, truckTypeApiPaths } from './truckApiPaths.js'

// --- UTILS ---
const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    return []
}

// --- QUERY KEYS ---
export const truckKeys = {
    all: ['trucks'],
    lists: () => [...truckKeys.all, 'list'],
    list: (carrierId) => [...truckKeys.lists(), 'carrier', String(carrierId)],
    detail: (id) => [...truckKeys.all, 'detail', String(id)],
}

export const truckCapacityKeys = {
    all: ['truck-capacities'],
    lists: () => [...truckCapacityKeys.all, 'list'],
    detail: (id) => [...truckCapacityKeys.all, 'detail', String(id)],
}

export const truckTypeKeys = {
    all: ['truck-types'],
    lists: () => [...truckTypeKeys.all, 'list'],
    detail: (id) => [...truckTypeKeys.all, 'detail', String(id)],
}

// --- API FUNCTIONS ---
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

// --- HOOKS ---

// TRUCKS
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
        onSuccess: (data, variables) => {
            const carrierId = data?.carrier ?? variables?.carrier
            const promises = [queryClient.invalidateQueries({ queryKey: truckKeys.all })]
            if (carrierId) {
                promises.push(queryClient.invalidateQueries({ queryKey: truckKeys.list(carrierId) }))
            }
            return Promise.all(promises)
        },
    })
}

export function useUpdateTruck() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateTruck,
        onSuccess: (data, variables) => {
            const carrierId = data?.carrier ?? variables?.payload?.carrier
            const promises = [
                queryClient.invalidateQueries({ queryKey: truckKeys.all }),
                queryClient.invalidateQueries({ queryKey: truckKeys.detail(variables.id) }),
            ]
            if (carrierId) {
                promises.push(queryClient.invalidateQueries({ queryKey: truckKeys.list(carrierId) }))
            }
            return Promise.all(promises)
        },
    })
}

export function useDeleteCarrierTruck() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteTruck,
        onSuccess: (id, variables) => {
            queryClient.removeQueries({ queryKey: truckKeys.detail(id) })
            const carrierId = variables?.carrierId
            const promises = [queryClient.invalidateQueries({ queryKey: truckKeys.all })]
            if (carrierId) {
                promises.push(queryClient.invalidateQueries({ queryKey: truckKeys.list(carrierId) }))
            }
            return Promise.all(promises)
        },
    })
}

// CAPACITIES
export function useGetTruckCapacities() {
    return useQuery({ queryKey: truckCapacityKeys.lists(), queryFn: fetchTruckCapacities })
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: truckCapacityKeys.all }),
    })
}

export function useUpdateTruckCapacity() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateTruckCapacity,
        onSuccess: (_, variables) => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: truckCapacityKeys.all }),
                queryClient.invalidateQueries({ queryKey: truckCapacityKeys.detail(variables.id) }),
            ])
        },
    })
}

// TYPES
export function useGetTruckTypes() {
    return useQuery({ queryKey: truckTypeKeys.lists(), queryFn: fetchTruckTypes })
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: truckTypeKeys.all }),
    })
}

export function useUpdateTruckType() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateTruckType,
        onSuccess: (_, variables) => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: truckTypeKeys.all }),
                queryClient.invalidateQueries({ queryKey: truckTypeKeys.detail(variables.id) }),
            ])
        },
    })
}
