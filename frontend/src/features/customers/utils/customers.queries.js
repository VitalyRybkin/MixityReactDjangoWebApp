import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'
import { REFERENCE_STALE_TIME } from '../../../utils/query.constants.js'

import { constructionObjectsApiPaths, customerApiPaths } from './customerApiPaths.js'

// --- UTILS ---
const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

// --- QUERY KEYS ---
export const customerKeys = {
    all: ['customer'],
    list: () => [...customerKeys.all, 'list'],
    detail: (id) => [...customerKeys.all, 'detail', String(id)],
    objectDetail: (id, objectId) => [...customerKeys.detail(id), 'object', String(objectId)],
    objects: (id) => [...customerKeys.detail(id), 'objects'],
    prices: (customerId, productIds = []) => [
        ...customerKeys.all,
        'prices',
        customerId,
        [...productIds].sort((a, b) => Number(a) - Number(b)),
    ],
}

// --- API FUNCTIONS ---
export const fetchCustomers = async () => {
    const res = await api.get(customerApiPaths.listCreate())
    return unwrapList(res.data)
}

export const fetchCustomerDetail = async (id) => {
    const res = await api.get(customerApiPaths.detail(id))
    return res.data
}

export const fetchCustomerObjectDetail = async (id, objectId) => {
    const res = await api.get(constructionObjectsApiPaths.detail(id, objectId))
    return res.data
}

export const fetchCustomerObjects = async (id) => {
    const res = await api.get(constructionObjectsApiPaths.listCreate(id))
    return unwrapList(res.data)
}

export const fetchCustomerPrices = async (customerId, productIds = []) => {
    const res = await api.get(customerApiPaths.prices(customerId), {
        params: {
            products: productIds,
        },
        paramsSerializer: {
            indexes: null,
        },
    })
    return unwrapList(res.data)
}

export const createCustomer = async (payload) => {
    const res = await api.post(customerApiPaths.listCreate(), payload)
    return res.data
}

export const updateCustomer = async ({ id, payload }) => {
    const res = await api.patch(customerApiPaths.detail(id), payload)
    return res.data
}

export const deleteCustomer = async (id) => {
    await api.delete(customerApiPaths.detail(id))
    return id
}

export const deleteCustomerObject = async ({ id, objectId }) => {
    if (objectId == null) {
        throw new Error('Construction object ID is missing')
    }

    await api.delete(constructionObjectsApiPaths.detail(id, objectId))
    return objectId
}

export const createConstructionObject = async ({ id, payload }) => {
    const res = await api.post(constructionObjectsApiPaths.listCreate(id), payload)
    return res.data
}

export const updateConstructionObject = async ({ id, objectId, payload }) => {
    const res = await api.patch(constructionObjectsApiPaths.detail(id, objectId), payload)
    return res.data
}

// --- HOOKS ---

export function useGetCustomers() {
    return useQuery({
        queryKey: customerKeys.list(),
        queryFn: fetchCustomers,
        staleTime: REFERENCE_STALE_TIME,
    })
}

export function useGetCustomer(id) {
    return useQuery({
        queryKey: customerKeys.detail(id),
        queryFn: () => fetchCustomerDetail(id),
        enabled: Boolean(id),
    })
}

export function useGetCustomerObject(id, objectId) {
    return useQuery({
        queryKey: customerKeys.objectDetail(id, objectId),
        queryFn: () => fetchCustomerObjectDetail(id, objectId),
        enabled: Boolean(id && objectId),
    })
}

export function useGetCustomerObjects(id) {
    return useQuery({
        queryKey: customerKeys.objects(id),
        queryFn: () => fetchCustomerObjects(id),
        enabled: Boolean(id),
        staleTime: REFERENCE_STALE_TIME,
    })
}

export function useGetCustomerPrices(customerId, productIds = []) {
    return useQuery({
        queryKey: customerKeys.prices(customerId, productIds),
        queryFn: () => fetchCustomerPrices(customerId, productIds),
        enabled: Boolean(customerId) && productIds.length > 0,
    })
}

export function useCreateCustomerObject() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createConstructionObject,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: customerKeys.all })
        },
    })
}

export function useUpdateCustomerObject() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateConstructionObject,
        onSuccess: (_, { id, objectId }) => {
            return Promise.all([
                queryClient.invalidateQueries({
                    queryKey: customerKeys.objects(id),
                }),
                queryClient.invalidateQueries({
                    queryKey: customerKeys.objectDetail(id, objectId),
                }),
            ])
        },
    })
}

export function useCreateCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createCustomer,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: customerKeys.all })
        },
    })
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateCustomer,
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: customerKeys.list() })
            await queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) })
        },
    })
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteCustomer,
        onSuccess: async (id) => {
            await queryClient.invalidateQueries({ queryKey: customerKeys.list() })
            queryClient.removeQueries({ queryKey: customerKeys.detail(id) })
        },
    })
}

export function useDeleteCustomerObject() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteCustomerObject,
        onSuccess: async (_, { id, objectId }) => {
            queryClient.removeQueries({
                queryKey: customerKeys.objectDetail(id, objectId),
            })
            await queryClient.invalidateQueries({
                queryKey: customerKeys.objects(id),
            })
        },
    })
}
