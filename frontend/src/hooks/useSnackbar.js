import { useState } from 'react'

const initialState = {
    open: false,
    message: '',
    severity: 'success',
}

export default function useSnackbar() {
    const [snack, setSnack] = useState(initialState)

    const showSnackbar = (message, severity = 'success') => {
        setSnack({
            open: true,
            message,
            severity,
        })
    }

    const closeSnackbar = () => {
        setSnack((prev) => ({ ...prev, open: false }))
    }

    return {
        snack,
        showSnackbar,
        closeSnackbar,
    }
}
