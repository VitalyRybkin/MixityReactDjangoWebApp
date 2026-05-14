import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'

import { clientApiPaths } from './clientApiPaths.js'

// --- UTILS ---
const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

// --- QUERY KEYS ---
export const clientKeys = {
    all: ['client'],
    list: () => [...clientKeys.all, 'list'],
    detail: (id) => [...clientKeys.all, 'detail', String(id)],
    contacts: (id) => [...clientKeys.all, 'detail', String(id), 'contacts'],
}

// --- API FUNCTIONS ---
export const fetchClients = async () => {
    const res = await api.get(clientApiPaths.listCreate())
    return unwrapList(res.data)
}

export const fetchClientDetail = async (id) => {
    const res = await api.get(clientApiPaths.detail(id))
    return res.data
}

export const createClient = async (payload) => {
    const res = await api.post(clientApiPaths.listCreate(), payload)
    return res.data
}

export const updateClient = async ({ id, payload }) => {
    const res = await api.patch(clientApiPaths.detail(id), payload)
    return res.data
}

export const deleteClient = async (id) => {
    await api.delete(clientApiPaths.detail(id))
    return id
}

// --- HOOKS ---

export function useGetClients() {
    return useQuery({
        queryKey: clientKeys.list(),
        queryFn: fetchClients,
    })
}

export function useGetClient(id) {
    return useQuery({
        queryKey: clientKeys.detail(id),
        queryFn: () => fetchClientDetail(id),
        enabled: Boolean(id),
    })
}

export function useCreateClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createClient,
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: clientKeys.all })
        },
    })
}

export function useUpdateClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateClient,
        onSuccess: (_, variables) => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: clientKeys.list() }),
                queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) }),
            ])
        },
    })
}

export function useDeleteClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteClient,
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: clientKeys.detail(id) })
            return queryClient.invalidateQueries({ queryKey: clientKeys.list() })
        },
    })
}
