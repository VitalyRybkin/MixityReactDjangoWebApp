import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import FormActions from '../../../components/ui/FormActions.jsx'
import { firstError } from '../../../utils/apiError.js'

import { useCreateTruckCapacity, useGetTruckCapacity, useUpdateTruckCapacity } from './trucks.queries.js'

const emptyForm = {
    capacity: '',
    description: '',
}

export default function TruckCapacityDialogFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: truckCapacity, isPending: loadingTruckCapacity } = useGetTruckCapacity(id)
    const createCapacity = useCreateTruckCapacity()
    const updateCapacity = useUpdateTruckCapacity()

    const [error, setError] = useState('')
    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            return
        }

        if (truckCapacity) {
            setForm({
                capacity: truckCapacity.capacity ?? '',
                description: truckCapacity.description ?? '',
            })
        }
    }, [truckCapacity, isEdit])

    const onChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    const saving = createCapacity.isPending || updateCapacity.isPending

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            if (isEdit) {
                await updateCapacity.mutateAsync({ id, payload: form })
            } else {
                await createCapacity.mutateAsync(form)
            }

            navigate('/truck-capacities')
        } catch (err) {
            setError(firstError(err))
        }
    }

    if (isEdit && loadingTruckCapacity) {
        return (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={{ id: truckCapacity?.capacity }} />

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать грузоподъемность` : 'Добавить грузоподъемность'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Грузоподъемность"
                            value={form.capacity}
                            onChange={onChange('capacity')}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Примечание"
                            value={form.description}
                            onChange={onChange('description')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <FormActions saving={saving} onCancel={() => navigate('/truck-capacities')} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
