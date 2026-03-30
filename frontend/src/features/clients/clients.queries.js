import api from "../../api.js";
import { clientApiPaths } from "./clientApiPaths.js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    throw new Error('Expected list response')
}

export const clientKeys = {
    all: ['clients'],
    list: () => ['client', 'list'],
    detail: (id) => ['client', 'detail', String(id)],
    contacts: (id) => ['client', String(id), 'contacts'],
}

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

export function useGetClients() {
    return useQuery({
        queryKey: clientKeys.list(),
        queryFn: fetchClients,
    })
}

export function useGetClientDetail(id) {
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
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: clientKeys.all})
        },
    })
}

export function useUpdateClient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateClient,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({queryKey: clientKeys.all})
            await queryClient.invalidateQueries({queryKey: clientKeys.detail(variables.id)})
        },
    })
}

export function useDeleteClient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteClient,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({queryKey: clientKeys.all})
            queryClient.removeQueries({queryKey: clientKeys.detail(id)})
            queryClient.removeQueries({queryKey: clientKeys.contacts(id)})
        },
    })
}