import { useEffect, useState } from 'react'

import { API_ERROR_EVENT } from '../../../utils/apiError.js'

import AppSnackbar from './AppSnackbar.jsx'

export default function GlobalApiErrorSnackbar() {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
    })

    useEffect(() => {
        const handleApiError = (event) => {
            setSnackbar({
                open: true,
                message: event.detail?.message || 'Не удалось выполнить запрос.',
            })
        }

        window.addEventListener(API_ERROR_EVENT, handleApiError)

        return () => {
            window.removeEventListener(API_ERROR_EVENT, handleApiError)
        }
    }, [])

    return (
        <AppSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity="error"
            onClose={() =>
                setSnackbar((prev) => ({
                    ...prev,
                    open: false,
                }))
            }
        />
    )
}
