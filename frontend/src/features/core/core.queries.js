import { useQuery } from '@tanstack/react-query'

import api from '../../api.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const coreKeys = {
    all: ['core'],
    list: () => ['core', 'list'],
}

const fetchDocumentation = async () => {
    const res = await api.get('/api/core/documentation/')
    return unwrapList(res.data)
}

export function useGetDocumentation() {
    return useQuery({
        queryKey: coreKeys.list(),
        queryFn: fetchDocumentation,
    })
}
