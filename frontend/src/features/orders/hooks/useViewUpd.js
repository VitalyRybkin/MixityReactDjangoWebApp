import { useCallback } from 'react'

import { viewUpd } from '../utils/orders.queries.js'

export function useViewUpd(showSnackbar) {
    return useCallback(
        async (orderId) => {
            try {
                const blob = await viewUpd(orderId)
                const blobUrl = URL.createObjectURL(blob)

                window.open(blobUrl, '_blank', 'noopener,noreferrer')

                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl)
                }, 60_000)
            } catch {
                showSnackbar('Не удалось открыть УПД.', 'error')
            }
        },
        [showSnackbar],
    )
}
