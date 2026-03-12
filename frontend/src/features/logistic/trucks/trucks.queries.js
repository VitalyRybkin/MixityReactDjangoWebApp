import { useQuery } from '@tanstack/react-query'

import api from '../../../api.js'

const unwrapList = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export const truckKeys = {
    all: ['trucks'],
    list: (id) => ['carrier', String(id), 'trucks'],
    detail: (id) => ['truck', String(id)],
}

export const fetchCarrierTrucks = async (id) => {
    const res = await api.get(`/api/logistic/carriers/${id}/trucks/`)
    return unwrapList(res.data)
}

export function useGetCarrierTrucks(id) {
    return useQuery({
        queryKey: truckKeys.list(id),
        queryFn: () => fetchCarrierTrucks(id),
        enabled: Boolean(id),
    })
}
