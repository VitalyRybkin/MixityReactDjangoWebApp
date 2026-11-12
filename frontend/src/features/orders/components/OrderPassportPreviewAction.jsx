import { useState } from 'react'

import { Box, CircularProgress } from '@mui/material'

import api from '../../../api.js'
import ViewAction from '../../../components/ui/buttons/ViewAction.jsx'
import AppSnackbar from '../../../components/ui/feedback/AppSnackbar.jsx'
import { exportQualityPassport } from '../../catalog/utils/exportQualityPassport.jsx'
import { useGetQualityPassportState } from '../utils/qualityPassports.queries.js'

/**
 * Preview only: the state API selects the passport attached to this order item,
 * even if the product has since received a newer passport.
 * For new orders it selects the currently issued passport.
 */
export default function OrderPassportPreviewAction({ productId, quantity, orderId, targetStatus, pendingPassport }) {
    const [loading, setLoading] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: '' })

    const { data: state } = useGetQualityPassportState({
        productId,
        quantity,
        orderId,
        targetStatus,
    })

    const passportId = pendingPassport ? null : state?.passport?.id

    const handlePreview = async (event) => {
        event?.preventDefault()
        event?.stopPropagation()
        if (!passportId || loading) return


        const previewWindow = window.open('', '_blank')
        if (!previewWindow) {
            setSnackbar({ open: true, message: 'Браузер заблокировал окно просмотра паспорта.' })
            return
        }

        previewWindow.document.title = 'Паспорт качества'
        previewWindow.document.body.textContent = 'Формирование PDF…'

        setLoading(true)
        try {
            const response = await api.get(`/api/catalog/quality-passports/${passportId}/`)
            const passport = response.data

            if (!passport?.id || !Array.isArray(passport.specifications)) {
                throw new Error('INCOMPLETE_PASSPORT_DATA')
            }

            await exportQualityPassport(passport, {
                mode: 'preview',
                previewWindow,
            })
        } catch (error) {
            if (!previewWindow.closed) previewWindow.close()

            const status = error?.response?.status
            const message =
                status === 403
                    ? 'Нет прав для просмотра паспорта качества.'
                    : status === 404
                      ? 'Паспорт качества не найден.'
                      : 'Не удалось открыть PDF паспорта качества.'

            setSnackbar({ open: true, message })
        } finally {
            setLoading(false)
        }
    }

    if (!passportId) return null

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {loading ? (
                <CircularProgress size={18} aria-label="Формирование паспорта" />
            ) : (
                <ViewAction
                    type="button"
                    size="small"
                    title="Просмотр паспорта качества"
                    aria-label="Просмотр PDF паспорта качества"
                    onClick={handlePreview}
                />
            )}

            <AppSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity="error"
                onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
            />
        </Box>
    )
}
