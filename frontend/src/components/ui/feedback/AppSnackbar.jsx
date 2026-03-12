import React from 'react'

import { Alert, Snackbar } from '@mui/material'

const AppSnackbar = ({
    open,
    message = '',
    severity = 'success',
    autoHideDuration = 2500,
    onClose,
    anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
}) => {
    return (
        <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose} anchorOrigin={anchorOrigin}>
            <Alert severity={severity} variant="filled" onClose={onClose}>
                {message}
            </Alert>
        </Snackbar>
    )
}

export default AppSnackbar
