import { useCallback } from 'react'

import { viewUpd } from '../utils/orders.queries.js'

export function useViewUpd(showSnackbar) {
    return useCallback(
        async (orderId) => {
            // Reserve the tab during the user's click: after await, browser
            // user activation may expire and window.open can be blocked.
            const previewWindow = window.open('', '_blank')
            if (!previewWindow) {
                showSnackbar('Браузер заблокировал окно просмотра УПД.', 'error')
                return
            }

            previewWindow.opener = null
            previewWindow.document.title = 'Просмотр УПД'
            previewWindow.document.body.textContent = 'Загружаем УПД…'

            try {
                const blob = await viewUpd(orderId)
                const blobUrl = URL.createObjectURL(blob)

                if (previewWindow.closed) {
                    URL.revokeObjectURL(blobUrl)
                    return
                }

                previewWindow.location.replace(blobUrl)
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
            } catch {
                if (!previewWindow.closed) previewWindow.close()
                showSnackbar('Не удалось открыть УПД.', 'error')
            }
        },
        [showSnackbar],
    )
}
