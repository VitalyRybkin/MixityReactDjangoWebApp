import { Button, Stack } from '@mui/material'

export default function FormActions({ saving, onCancel, submitLabel = 'Сохранить', cancelLabel = 'Отмена' }) {
    return (
        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Сохранение...' : submitLabel}
            </Button>

            <Button variant="outlined" onClick={onCancel} disabled={saving}>
                {cancelLabel}
            </Button>
        </Stack>
    )
}
