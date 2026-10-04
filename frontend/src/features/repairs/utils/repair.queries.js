// --- UTILS ---
import {repairCompaniesApiPaths} from "./repairApiPaths.js";
import api from "../../../api.js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

// --- QUERY KEYS ---
export const repairCompaniesKeys = {
    all: ['repairCompanies'],
    list: () => [...repairCompaniesKeys.all, 'list'],
    detail: (id) => [...repairCompaniesKeys.all, 'detail', String(id)],
    contacts: (id) => [...repairCompaniesKeys.all, 'detail', String(id), 'contacts'],
}

// --- API FUNCTIONS ---

export const fetchRepairCompanies = async () => {
    const response = await api.get(repairCompaniesApiPaths.listCreate())
    return unwrapList(response.data)
}

export const fetchRepairCompanyDetail = async(id) => {
    const response = await api.get(repairCompaniesApiPaths.detail(id))
    return response.data
}

export const createRepairCompany = async (payload) => {
    const response = await api.post(repairCompaniesApiPaths.listCreate(), payload)
    return response.data
}

export const updateRepairCompany = async (id, payload) => {
    const response = await api.patch(repairCompaniesApiPaths.detail(id), payload)
    return response.data
}

export const deleteRepairCompany = async (id) => {
    const response = await api.delete(repairCompaniesApiPaths.detail(id))
    return response.data
}


// --- HOOKS ---

export function useGetRepairCompanies() {
    return useQuery({
        queryKey: repairCompaniesKeys.list(),
        queryFn: fetchRepairCompanies,
    })
}

export function useGetRepairCompany(id) {
    return useQuery({
        queryKey: repairCompaniesKeys.detail(id),
        queryFn: () => fetchRepairCompanyDetail(id),
        enabled: Boolean(id),
    })
}

export function useCreateRepairCompany() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createRepairCompany,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.all })
        },
    })
}

export function useUpdateRepairCompany(){
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateRepairCompany,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.list() })
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.detail(variables.id) })
        },
    })
}

export function useDeleteRepairCompany(){
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteRepairCompany,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.list() })
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.detail(id) })
        },
    })
}
