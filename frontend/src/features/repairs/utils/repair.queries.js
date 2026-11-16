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

// DRF uses 404 for invalid pages as well as missing resources. Match only
// its pagination detail, including the backend's localized error envelope.
export const isRepairRequestsPageOutOfRange = (error) => {
    const data = error?.response?.data
    const detail = data?.errors?.detail ?? data?.detail
    return error?.response?.status === 404 &&
        ['Invalid page.', 'Неправильная страница'].includes(detail)
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
    requests_export: (filters = {}) => [
        ...repairRequestsKeys.all,
        'requests_export',
        {
            dateFrom: filters.dateFrom || '',
            dateTo: filters.dateTo || '',
            status: filters.status || '',
            location: filters.location || '',
            repairCompanyId: filters.repairCompanyId || '',
            customerId: filters.customerId || '',
            objectId: filters.objectId || filters.constructionObjectId || '',
        },
    ],
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

export const fetchExportRequests = async ({
    dateFrom,
    dateTo,
    status,
    location,
    repairCompanyId,
    customerId,
    objectId,
    constructionObjectId,
} = {}) => {
    const params = {}

    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    if (status) params.status = status
    if (location) params.location = location
    if (customerId) params.customer_id = customerId
    if (repairCompanyId) params.repair_company_id = repairCompanyId
    if (objectId || constructionObjectId) params.object_id = objectId || constructionObjectId

    const res = await api.get(repairRequestsApiPaths.export(), { params })
    return unwrapList(res.data)
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
            // Discard pre-deletion responses before updating cached pages.
            await queryClient.cancelQueries({ queryKey: repairRequestsKeys.lists() })

            queryClient.removeQueries({
                queryKey: repairRequestsKeys.detail(id),
            })

            queryClient.setQueriesData({ queryKey: repairRequestsKeys.lists() }, (data) => {
                if (!Array.isArray(data?.results)) return data
                const results = data.results.filter((row) => String(row.id) !== String(id))
                if (results.length === data.results.length) return data
                return { ...data, results, count: Math.max(0, data.count - 1) }
            })

            // The list chooses a valid page before fetching again. Refetching
            // here would request a now-nonexistent final page after deletion.
            await queryClient.invalidateQueries({
                queryKey: repairRequestsKeys.lists(),
                refetchType: 'none',
            })
        },
    })
}

export function useExportRequests(filters = {}) {
    return useQuery({
        queryKey: repairRequestsKeys.requests_export(filters),
        queryFn: () =>
            fetchExportRequests({
                dateFrom: filters.dateFrom || '',
                dateTo: filters.dateTo || '',
                status: filters.status || '',
                location: filters.location || '',
                repairCompanyId: filters.repairCompanyId || '',
                customerId: filters.customerId || '',
                objectId: filters.objectId || filters.constructionObjectId || '',
            }),
        enabled: false,
    })
}
