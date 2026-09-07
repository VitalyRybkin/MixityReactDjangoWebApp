import { useNavigate } from 'react-router-dom'

import { Button, Stack } from '@mui/material'

export default function FormActions({
    saving = false,
    onCancel,
    submitLabel = 'Сохранить',
    cancelLabel = 'Отмена',
    cancelFirst = false,
    sx,
}) {
    const navigate = useNavigate()

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
            return
        }

        navigate(-1)
    }

    const submitButton = (
        <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Сохранение...' : submitLabel}
        </Button>
    )

    const cancelButton = (
        <Button variant="outlined" onClick={handleCancel} disabled={saving}>
            {cancelLabel}
        </Button>
    )

    return (
        <Stack direction="row" spacing={2} sx={sx}>
            {cancelFirst ? (
                <>
                    {cancelButton}
                    {submitButton}
                </>
            ) : (
                <>
                    {submitButton}
                    {cancelButton}
                </>
            )}
        </Stack>
    )
}
