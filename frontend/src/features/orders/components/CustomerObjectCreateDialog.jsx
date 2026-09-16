import { useEffect, useState } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import { firstError } from '../../../utils/apiError.js'
import { useCreateCustomerObject } from '../../customers/utils/customers.queries.js'

const emptyForm = {
    name: '',
    address: '',
}

export default function CustomerObjectCreateDialog({ open, customerId, onClose, onSaved }) {
    const createObject = useCreateCustomerObject()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const saving = createObject.isPending

    useEffect(() => {
        if (!open) {
            return
        }

        setForm(emptyForm)
        setError('')
    }, [open])

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
            const object = await createObject.mutateAsync({
                id: customerId,
                payload: form,
            })

            await onSaved(object)
        } catch (err) {
            setError(firstError(err))
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>Добавить объект</DialogTitle>

            <DialogContent>
                <Stack
                    component="form"
                    id="customer-object-create-form"
                    onSubmit={handleSubmit}
                    spacing={2}
                    sx={{ mt: 1 }}
                >
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Наименование"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Адрес"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        minRows={3}
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button type="button" onClick={onClose} disabled={saving}>
                    Отмена
                </Button>

                <Button type="submit" form="customer-object-create-form" variant="contained" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
