// --- UTILS ---
import { useQuery } from '@tanstack/react-query'

import api from '../../../api.js'

import { catalogApiPaths as productApiPaths } from './catalogApiPaths.js'

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

export const productKeys = {
    all: ['product'],
    list: () => [...productKeys.all, 'list'],
    detail: (id) => [...productKeys.all, 'detail', String(id)],
}

// --- API FUNCTIONS ---
export const fetchProducts = async () => {
    const res = await api.get(productApiPaths.listCreate())
    return unwrapList(res.data)
}

// --- HOOKS ---

export function useGetProducts() {
    return useQuery({
        queryKey: productKeys.list(),
        queryFn: fetchProducts,
    })
}
