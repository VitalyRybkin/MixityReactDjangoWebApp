import { useQuery } from '@tanstack/react-query'

import api from '../../../api.js'

const qualityPassportApiPaths = {
    state: () => '/api/catalog/quality-passports/state/',
}

export const qualityPassportKeys = {
    all: ['quality-passports'],
    state: ({ productId, orderId, quantity, targetStatus }) => [
        ...qualityPassportKeys.all,
        'state',
        productId || null,
        orderId || null,
        quantity ?? '',
        targetStatus || '',
    ],
}

export async function fetchQualityPassportState({ productId, orderId, quantity, targetStatus }) {
    const params = { product_id: productId }

    if (orderId) params.order_id = orderId
    if (targetStatus) params.target_status = targetStatus

    const amount = String(quantity ?? '')
        .trim()
        .replace(',', '.')
    if (amount && Number.isFinite(Number(amount)) && Number(amount) > 0) {
        params.quantity = amount
    }

    const res = await api.get(qualityPassportApiPaths.state(), { params })
    return res.data
}

export function useGetQualityPassportState({ productId, orderId = null, quantity = '', targetStatus = null }) {
    const parameters = { productId, orderId, quantity, targetStatus }

    return useQuery({
        queryKey: qualityPassportKeys.state(parameters),
        queryFn: () => fetchQualityPassportState(parameters),
        enabled: Boolean(productId),
        staleTime: 0,
        refetchOnWindowFocus: 'always',
    })
}
