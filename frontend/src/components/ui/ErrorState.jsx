import { Alert } from '@mui/material'

import ReloadAction from './buttons/ReloadAction.jsx'

export default function ErrorState({ error, onRetry, loading }) {
    const message = error?.response?.data?.detail || error?.message || 'Не удалось загрузить данные'

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
