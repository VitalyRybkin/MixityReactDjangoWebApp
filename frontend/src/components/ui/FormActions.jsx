import { useNavigate } from 'react-router-dom'

import { Button, Stack } from '@mui/material'

export default function FormActions({ saving, onCancel, submitLabel = 'Сохранить', cancelLabel = 'Отмена' }) {
    const navigate = useNavigate()

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        } else {
            navigate(-1)
        }
    }

    return (
        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Сохранение...' : submitLabel}
            </Button>

            <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                {cancelLabel}
            </Button>
        </Stack>
    )
}
