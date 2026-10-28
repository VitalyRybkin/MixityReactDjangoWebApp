// --- UTILS ---
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import api from '../../../api.js'
import {LIST_STALE_TIME, REFERENCE_STALE_TIME} from '../../../utils/query.constants.js'

import {repairCompaniesApiPaths, repairRequestsApiPaths} from './repairApiPaths.js'


export const unwrapList = (data) => {
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

export const repairRequestsKeys = {
    all: ['repairRequests'],
    lists: () => [...repairRequestsKeys.all, 'list'],
    list: (filters) => [...repairRequestsKeys.lists(), filters],
    details: () => [...repairRequestsKeys.all, 'detail'],
    detail: (id) => [...repairRequestsKeys.details(), String(id)],
}

// --- API FUNCTIONS FOR COMPANY ---

export const fetchRepairCompanies = async () => {
    const response = await api.get(repairCompaniesApiPaths.listCreate())
    return unwrapList(response.data)
}

export const fetchRepairCompanyDetail = async (id) => {
    const response = await api.get(repairCompaniesApiPaths.detail(id))
    return response.data
}

export const createRepairCompany = async (payload) => {
    const response = await api.post(repairCompaniesApiPaths.listCreate(), payload)
    return response.data
}

export const updateRepairCompany = async ({ id, payload }) => {
    const response = await api.patch(repairCompaniesApiPaths.detail(id), payload)

    return response.data
}

export const deleteRepairCompany = async (id) => {
    const response = await api.delete(repairCompaniesApiPaths.detail(id))
    return response.data
}

// --- API FUNCTIONS FOR REPAIR REQUESTS ---

export const fetchRepairRequests = async (filters = {}) => {
    const params = {}

    if (filters.page) {
        params.page = filters.page
    }

    if (filters.dateFrom) {
        params.date_from = filters.dateFrom
    }

    if (filters.dateTo) {
        params.date_to = filters.dateTo
    }

    if (filters.status) {
        params.status = filters.status
    }

    if (filters.location) {
        params.location = filters.location
    }

    if (filters.customerId) {
        params.customer_id = filters.customerId
    }

    if (filters.objectId) {
        params.object_id = filters.objectId
    }

    if (filters.repairCompanyId) {
        params.repair_company_id = filters.repairCompanyId
    }

    if (filters.pageSize) {
        params.page_size = filters.pageSize
    }

    const response = await api.get(repairRequestsApiPaths.listCreate(), { params })

    return response.data
}

export const fetchRepairRequestDetail = async (id) => {
    const response = await api.get(repairRequestsApiPaths.detail(id))
    return response.data
}

export const createRepairRequest = async (payload) => {
    const response = await api.post(repairRequestsApiPaths.listCreate(), payload)
    return response.data
}

export const updateRepairRequest = async ({ id, payload }) => {
    const res = await api.patch(repairRequestsApiPaths.detail(id), payload)
    return res.data
}

export const deleteRepairRequest = async (id) => {
    await api.delete(repairRequestsApiPaths.detail(id))
    return id
}

// --- HOOKS FOR COMPANIES ---

export function useGetRepairCompanies() {
    return useQuery({
        queryKey: repairCompaniesKeys.list(),
        queryFn: fetchRepairCompanies,
        staleTime: REFERENCE_STALE_TIME,
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

export function useUpdateRepairCompany() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateRepairCompany,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.list() })
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.detail(variables.id) })
        },
    })
}

export function useDeleteRepairCompany() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteRepairCompany,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.list() })
            await queryClient.invalidateQueries({ queryKey: repairCompaniesKeys.detail(id) })
        },
    })
}

// --- HOOKS FOR REPAIR REQUESTS ---

export function useGetRepairRequests(filters) {
    return useQuery({
        queryKey: repairRequestsKeys.list(filters),
        queryFn: () => fetchRepairRequests(filters),
        staleTime: LIST_STALE_TIME,
    })
}

export function useGetRepairRequest(id, options = {}) {
    return useQuery({
        queryKey: repairRequestsKeys.detail(id),
        ...options,
        queryFn: () => fetchRepairRequestDetail(id),
        enabled: Boolean(id) && options.enabled !== false,
    })
}

export function useCreateRepairRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createRepairRequest,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: repairRequestsKeys.all,
            })
        },
    })
}

export function useUpdateRepairRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateRepairRequest,

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: repairRequestsKeys.lists(),
            })

            await queryClient.invalidateQueries({
                queryKey: repairRequestsKeys.detail(variables.id),
            })
        },
    })
}

export function useDeleteRepairRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteRepairRequest,

        onSuccess: async (id) => {
            queryClient.removeQueries({
                queryKey: repairRequestsKeys.detail(id),
            })

            await queryClient.invalidateQueries({
                queryKey: repairRequestsKeys.lists(),
            })
        },
    })
}