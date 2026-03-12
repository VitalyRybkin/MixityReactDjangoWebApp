import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import FormActions from '../../../components/ui/FormActions.jsx'
import { firstError } from '../../../utils/apiError.js'

import { useCreateTruckType, useGetTruckType, useUpdateTruckType } from './trucks.queries.js'

const emptyForm = {
    name: '',
    description: '',
}

export default function TruckTypeDialogFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: truckType, isPending: loadingTruckType } = useGetTruckType(id)
    const createType = useCreateTruckType()
    const updateType = useUpdateTruckType()

    const [error, setError] = useState('')
    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            return
        }

        if (truckType) {
            setForm({
                name: truckType.name ?? '',
                description: truckType.description ?? '',
            })
        }
    }, [truckType, isEdit])

    const onChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    const saving = createType.isPending || updateType.isPending

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            if (isEdit) {
                await updateType.mutateAsync({ id, payload: form })
            } else {
                await createType.mutateAsync(form)
            }

            navigate('/truck-types')
        } catch (err) {
            setError(firstError(err))
        }
    }

    if (isEdit && loadingTruckType) {
        return (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={{ id: truckType?.name }} />

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать тип` : 'Добавить тип'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <TextField label="Тип" value={form.name} onChange={onChange('name')} fullWidth required />

                        <TextField
                            label="Примечание"
                            value={form.description}
                            onChange={onChange('description')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <FormActions saving={saving} onCancel={() => navigate('/truck-types')} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
