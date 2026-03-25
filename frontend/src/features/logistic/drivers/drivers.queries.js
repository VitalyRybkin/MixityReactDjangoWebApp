import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

import { driverApiPaths } from './driverApiPaths.js'

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    throw new Error('Expected list response')
}

export const driverKeys = {
    all: ['drivers'],
    lists: () => ['drivers', 'list'],
    list: (carrierId) => ['drivers', 'list', 'carrier', String(carrierId)],
    detail: (id) => ['drivers', 'detail', String(id)],
}

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
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({ queryKey: driverKeys.all })

            const carrierId = data?.carrier ?? variables?.carrier
            if (carrierId) {
                await queryClient.invalidateQueries({
                    queryKey: driverKeys.list(carrierId),
                })
            }
        },
    })
}

export function useUpdateDriver() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateDriver,
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({ queryKey: driverKeys.all })
            await queryClient.invalidateQueries({
                queryKey: driverKeys.detail(variables.id),
            })

            const carrierId = data?.carrier ?? variables?.payload?.carrier
            if (carrierId) {
                await queryClient.invalidateQueries({
                    queryKey: driverKeys.list(carrierId),
                })
            }
        },
    })
}

export function useDeleteDriver() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteDriver,
        onSuccess: async (id, variables) => {
            await queryClient.invalidateQueries({ queryKey: driverKeys.all })
            queryClient.removeQueries({ queryKey: driverKeys.detail(id) })

            const carrierId = variables?.carrierId
            if (carrierId) {
                await queryClient.invalidateQueries({
                    queryKey: driverKeys.list(carrierId),
                })
            }
        },
    })
}
