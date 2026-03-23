import { Alert } from '@mui/material'

import getErrorMessage from '../../utils/getErrorMessage.js'

import ReloadAction from './buttons/ReloadAction.jsx'

export default function ErrorState({ error, onRetry, loading }) {
    const message = getErrorMessage(error)

    return (
        <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={onRetry && <ReloadAction onClick={onRetry} disabled={loading} />}
        >
            {message}
        </Alert>
    )
}
