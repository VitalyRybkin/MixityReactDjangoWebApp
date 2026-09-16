import { useEffect, useState } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import { firstError } from '../../utils/apiError.js'

import { useCreateCustomerObject, useUpdateCustomerObject } from './utils/customers.queries.js'

const emptyForm = {
    name: '',
    address: '',
}

export default function CustomerObjectDialog({
    open,
    mode = 'create',
    customerId,
    initialData = null,
    onClose,
    onSaved,
}) {
    const createObject = useCreateCustomerObject()
    const updateObject = useUpdateCustomerObject()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const isEdit = mode === 'edit'
    const saving = createObject.isPending || updateObject.isPending

    useEffect(() => {
        if (!open) {
            return
        }

        setError('')

        if (isEdit && initialData) {
            setForm({
                name: initialData.name ?? '',
                address: initialData.address ?? '',
            })
            return
        }

        setForm(emptyForm)
    }, [open, isEdit, initialData])

    const handleChange = (event) => {
        const { name, value } = event.target

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        setError('')

        try {
            let savedObject

            if (isEdit) {
                savedObject = await updateObject.mutateAsync({
                    id: customerId,
                    objectId: initialData.id,
                    payload: form,
                })
            } else {
                savedObject = await createObject.mutateAsync({
                    id: customerId,
                    payload: form,
                })
            }

            await onSaved?.(savedObject)
        } catch (err) {
            setError(firstError(err))
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? 'Редактировать объект' : 'Добавить объект'}</DialogTitle>

            <DialogContent sx={{ pt: 1, pb: 1 }}>
                <Stack
                    component="form"
                    id="customer-object-dialog-form"
                    onSubmit={handleSubmit}
                    spacing={1.5}
                    sx={{ mt: 0.5 }}
                >
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        size="small"
                        label="Наименование"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        fullWidth
                        autoFocus
                    />

                    <TextField
                        size="small"
                        label="Адрес"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        multiline
                        minRows={3}
                        fullWidth
                    />
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    pb: 3,
                    pt: 1,
                }}
            >
                <Button type="button" onClick={onClose} disabled={saving}>
                    Отмена
                </Button>

                <Button type="submit" form="customer-object-dialog-form" variant="contained" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
