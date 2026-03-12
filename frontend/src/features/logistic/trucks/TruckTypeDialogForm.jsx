import React, { useState } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import { firstError } from '../../../utils/apiError.js'

import { useCreateTruckType } from './trucks.queries.js'

const emptyForm = {
    truckType: '',
    description: '',
}

export default function TruckTypeCreateDialog({ open, onClose, onCreated }) {
    const createType = useCreateTruckType()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const onChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    const handleClose = () => {
        setForm(emptyForm)
        setError('')
        onClose()
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const created = await createType.mutateAsync(form)
            setForm(emptyForm)
            setError('')
            onCreated(created)
            onClose()
        } catch (err) {
            setError(firstError(err))
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Добавить тип</DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField label="Тип" value={form.truckType} onChange={onChange('truckType')} fullWidth required />

                    <TextField
                        label="Примечание"
                        value={form.description}
                        onChange={onChange('description')}
                        fullWidth
                        multiline
                        minRows={3}
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Отмена</Button>
                <Button onClick={onSubmit} variant="contained" disabled={createType.isPending}>
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    )
}
