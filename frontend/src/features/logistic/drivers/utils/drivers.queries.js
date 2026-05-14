import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../../api.js'

import { driverApiPaths } from './driverApiPaths.js'

// --- UTILS ---
const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

// --- QUERY KEYS ---
export const driverKeys = {
    all: ['drivers'],
    lists: () => [...driverKeys.all, 'list'],
    list: (carrierId) => [...driverKeys.lists(), 'carrier', String(carrierId)],
    detail: (id) => [...driverKeys.all, 'detail', String(id)],
}

// --- API FUNCTIONS ---
export const fetchCarrierDrivers = async (carrierId) => {
    const res = await api.get(driverApiPaths.carrierList(carrierId))
    return unwrapList(res.data)
}

const fetchDriver = async (id) => {
    const res = await api.get(driverApiPaths.detail(id))
    return res.data
}

const createDriver = async (payload) => {
    const res = await api.post(driverApiPaths.listCreate(), payload)
    return res.data
}

const updateDriver = async ({ id, payload }) => {
    const res = await api.patch(driverApiPaths.detail(id), payload)
    return res.data
}

const deleteDriver = async ({ id }) => {
    await api.delete(driverApiPaths.detail(id))
    return id
}

// --- HOOKS ---

export function useGetDrivers(carrierId) {
    return useQuery({
        queryKey: driverKeys.list(carrierId),
        queryFn: () => fetchCarrierDrivers(carrierId),
        enabled: Boolean(carrierId),
    })
}

export function useGetDriver(id) {
    return useQuery({
        queryKey: driverKeys.detail(id),
        queryFn: () => fetchDriver(id),
        enabled: Boolean(id),
    })
}

export function useCreateDriver() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createDriver,
        onSuccess: (data, variables) => {
            const carrierId = data?.carrier ?? variables?.carrier
            const promises = [queryClient.invalidateQueries({ queryKey: driverKeys.all })]

            if (carrierId) {
                promises.push(queryClient.invalidateQueries({ queryKey: driverKeys.list(carrierId) }))
            }
            return Promise.all(promises)
        },
    })
}

export function useUpdateDriver() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateDriver,
        onSuccess: (data, variables) => {
            const carrierId = data?.carrier ?? variables?.payload?.carrier
            const promises = [
                queryClient.invalidateQueries({ queryKey: driverKeys.all }),
                queryClient.invalidateQueries({ queryKey: driverKeys.detail(variables.id) }),
            ]

            if (carrierId) {
                promises.push(queryClient.invalidateQueries({ queryKey: driverKeys.list(carrierId) }))
            }
            return Promise.all(promises)
        },
    })
}

export function useDeleteDriver() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteDriver,
        onSuccess: (id, variables) => {
            queryClient.removeQueries({ queryKey: driverKeys.detail(id) })
            const carrierId = variables?.carrierId
            const promises = [queryClient.invalidateQueries({ queryKey: driverKeys.all })]

            if (carrierId) {
                promises.push(queryClient.invalidateQueries({ queryKey: driverKeys.list(carrierId) }))
            }
            return Promise.all(promises)
        },
    })
}
