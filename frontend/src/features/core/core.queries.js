import { useQuery } from '@tanstack/react-query'

import api from '../../api.js'

import { documentationApiPaths } from './documentationApiPaths.js'

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    throw new Error('Expected list response')
}

export const documentationKeys = {
    all: ['documentation'],
    list: () => ['documentation', 'list'],
    detail: (id) => ['documentation', 'detail', String(id)],
}

export const fetchDocumentation = async () => {
    const res = await api.get(documentationApiPaths.list())
    return unwrapList(res.data)
}

export const fetchDocumentationDetail = async (id) => {
    const res = await api.get(documentationApiPaths.detail(id))
    return res.data
}

export function useGetDocumentation() {
    return useQuery({
        queryKey: documentationKeys.list(),
        queryFn: fetchDocumentation,
    })
}

export function useGetDocumentationDetail(id) {
    return useQuery({
        queryKey: documentationKeys.detail(id),
        queryFn: () => fetchDocumentationDetail(id),
        enabled: Boolean(id),
    })
}
