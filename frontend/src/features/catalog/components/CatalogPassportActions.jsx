import { useState } from 'react'

import { Box, CircularProgress } from '@mui/material'

import api from '../../../api.js'
import DownAction from '../../../components/ui/buttons/DownloadAction.jsx'
import ViewAction from '../../../components/ui/buttons/ViewAction.jsx'
import AppSnackbar from '../../../components/ui/feedback/AppSnackbar.jsx'
import { exportQualityPassport, qualityPassportPdfFilename } from '../utils/exportQualityPassport.jsx'

export default function CatalogPassportActions({ passportId, passportSummary, productName }) {
    const [loading, setLoading] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })

    const showError = (message) => {
        setSnackbar({ open: true, message, severity: 'error' })
    }

    const handleExport = async (mode) => {
        if (!passportId || loading) return

        const previewWindow = mode === 'preview' ? window.open('', '_blank') : null
        let fileHandle = null

        if (mode === 'download' && typeof window.showSaveFilePicker === 'function') {
            const suggestedName = qualityPassportPdfFilename({
                id: passportId,
                number: passportSummary?.number,
                issue_date: passportSummary?.issue_date,
                product: { name: productName },
            })

            try {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName,
                    types: [
                        {
                            description: 'PDF',
                            accept: { 'application/pdf': ['.pdf'] },
                        },
                    ],
                })
            } catch (error) {
                if (error.name === 'AbortError') return

                console.warn('Native PDF saving unavailable; using browser download', error)
            }
        }

        if (mode === 'preview' && !previewWindow) {
            showError('Браузер заблокировал окно просмотра паспорта.')
            return
        }

        if (previewWindow) {
            previewWindow.document.title = 'Паспорт качества'
            previewWindow.document.body.textContent = 'Формирование PDF…'
        }

        setLoading(true)
        try {
            const response = await api.get(`/api/catalog/quality-passports/${passportId}/`)
            const passport = response.data

            if (!passport?.id || !Array.isArray(passport.specifications)) {
                throw new Error('INCOMPLETE_PASSPORT_DATA')
            }

            await exportQualityPassport(passport, { mode, previewWindow, fileHandle })
        } catch (error) {
            if (previewWindow && !previewWindow.closed) previewWindow.close()

            const status = error?.response?.status
            const message =
                status === 403
                    ? 'Нет прав для просмотра паспорта качества.'
                    : status === 404
                      ? 'Паспорт качества не найден.'
                      : 'Не удалось сформировать PDF паспорта качества.'
            showError(message)
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
                <>
                    <ViewAction title="Просмотр паспорта качества" onClick={() => handleExport('preview')} />
                    <DownAction title="Скачать паспорт качества (PDF)" onClick={() => handleExport('download')} />
                </>
            )}

            <AppSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
        </Box>
    )
}
