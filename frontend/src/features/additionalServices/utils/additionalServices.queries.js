import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    createAdditionalService,
    deleteAdditionalService,
    getAdditionalService,
    getAdditionalServiceProviders,
    getAdditionalServices,
    updateAdditionalService,
} from './additionalServices.api.js'

const all = ['additionalServices']
export const additionalServiceKeys = {
    all,
    list: (filters, page) => [...all, 'list', filters, page],
    detail: (id) => [...all, 'detail', String(id)],
    providers: (providerType) => [...all, 'providers', providerType],
}

export const useAdditionalServices = (filters, page) => useQuery({
    queryKey: additionalServiceKeys.list(filters, page),
    queryFn: () => getAdditionalServices(filters, page),
})

export const useAdditionalService = (id) => useQuery({
    queryKey: additionalServiceKeys.detail(id),
    queryFn: () => getAdditionalService(id),
    enabled: Boolean(id),
})

export const useAdditionalServiceProviders = (providerType) => useQuery({
    queryKey: additionalServiceKeys.providers(providerType),
    queryFn: () => getAdditionalServiceProviders(providerType),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(providerType),
})

const useWriteMutation = (mutationFn) => {
    const client = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: () => client.invalidateQueries({ queryKey: all }),
    })
}

export const useCreateAdditionalService = () => useWriteMutation(createAdditionalService)
export const useUpdateAdditionalService = () => useWriteMutation(updateAdditionalService)
export const useDeleteAdditionalService = () => useWriteMutation(deleteAdditionalService)
