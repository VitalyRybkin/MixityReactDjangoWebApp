import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const driverKeys = {
    all: ['drivers'],
    lists: () => ['drivers', 'list'],
    list: (carrierId) => ['drivers', 'list', 'carrier', String(carrierId)],
    detail: (id) => ['drivers', 'detail', String(id)],
}

export const fetchCarrierDrivers = async (carrierId) => {
    const res = await api.get(`/api/logistic/carriers/${carrierId}/drivers/`)
    return unwrapList(res.data)
}

const fetchDriver = async (id) => {
    const res = await api.get(`/api/logistic/drivers/${id}/`)
    return res.data
}

const createDriver = async ({ payload }) => {
    const res = await api.post('/api/logistic/drivers/', payload)
    return res.data
}

const updateDriver = async ({ id, payload }) => {
    const res = await api.patch(`/api/logistic/drivers/${id}/`, payload)
    return res.data
}

const deleteDriver = async ({ id }) => {
    await api.delete(`/api/logistic/drivers/${id}/`)
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

            const carrierId = data?.carrier ?? variables?.payload?.carrier
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
