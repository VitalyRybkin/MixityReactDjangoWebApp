import { useState } from 'react'

import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material'

import { firstError } from '../../../utils/apiError.js'

// Mount the form only while the dialog is open. This also resets the input
// and any previous error when reopening the dialog for a different row.
function ReferenceItemCreateForm({ title, label, saving, onCreate, onCreated, onClose, errorMessage }) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        const value = name.trim()
        if (saving || !value) return

        setError('')
        try {
            const created = await onCreate(value)
            onCreated(created)
        } catch (err) {
            setError(firstError(err) || errorMessage || 'Не удалось добавить запись')
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{title}</DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    autoFocus
                    fullWidth
                    required
                    label={label}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    sx={{ mt: 1 }}
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Отмена
                </Button>
                <Button type="submit" variant="contained" disabled={saving || !name.trim()}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </form>
    )
}

/**
 * Common dialog for adding a name to a reference directory.
 * Each feature owns its mutation, API permissions, and cache invalidation.
 * onCreate receives a trimmed string and resolves to the created item.
 */
export default function ReferenceItemCreateDialog({
    open,
    title,
    label,
    saving = false,
    onCreate,
    onCreated,
    onClose,
    errorMessage,
}) {
    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
            {open && (
                <ReferenceItemCreateForm
                    title={title}
                    label={label}
                    saving={saving}
                    onCreate={onCreate}
                    onCreated={onCreated}
                    onClose={onClose}
                    errorMessage={errorMessage}
                />
            )}
        </Dialog>
    )
}
