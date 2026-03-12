import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import FormActions from '../../../components/ui/FormActions.jsx'
import { firstError } from '../../../utils/apiError.js'
import { normalizePhoneInput, validatePhoneValue } from '../../../utils/phone.js'

import { useCreateCarrier, useGetCarrier, useUpdateCarrier } from './carriers.queries.js'

const emptyForm = {
    name: '',
    fullName: '',
    address: '',
    phone: '',
    email: '',
    description: '',
}

export default function CarrierFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: carrier, isPending: loadingCarrier, error: loadError } = useGetCarrier(id)
    const createCarrier = useCreateCarrier()
    const updateCarrier = useUpdateCarrier()

    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setPhoneError('')
            return
        }

        if (carrier) {
            setForm({
                name: carrier.name ?? '',
                fullName: carrier.fullName ?? '',
                address: carrier.address ?? '',
                phone: carrier.phone ?? '',
                email: carrier.email ?? '',
                description: carrier.description ?? '',
            })
            setPhoneError('')
        }
    }, [carrier, isEdit])

    useEffect(() => {
        if (loadError) {
            setError(loadError?.response?.data?.detail || 'Ошибка загрузки данных')
        }
    }, [loadError])

    const onChange = (field) => (e) => {
        let value = e.target.value
        if (field === 'phone') {
            value = normalizePhoneInput(value)
            setPhoneError(validatePhoneValue(value))
        }
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    const validateBeforeSubmit = () => {
        const currentPhoneError = validatePhoneValue(form.phone)
        setPhoneError(currentPhoneError)
        return !currentPhoneError
    }

    const saving = createCarrier.isPending || updateCarrier.isPending

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateBeforeSubmit()) {
            return
        }

        try {
            if (isEdit) {
                await updateCarrier.mutateAsync({ id, payload: form })
            } else {
                await createCarrier.mutateAsync(form)
            }
            navigate('/carriers')
        } catch (e2) {
            setError(firstError(e2))
        }
    }

    if (isEdit && loadingCarrier) return <CircularProgress />

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={{ id: carrier?.name }} />
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать ${form.fullName || ''}` : 'Создать грузоперевозчика'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <TextField label="Наименование" value={form.name} onChange={onChange('name')} fullWidth />
                        <TextField
                            label="Полное наименование"
                            value={form.fullName}
                            onChange={onChange('fullName')}
                            fullWidth
                        />
                        <TextField label="Адрес" value={form.address} onChange={onChange('address')} fullWidth />
                        <TextField
                            label="Телефон"
                            value={form.phone}
                            onChange={onChange('phone')}
                            fullWidth
                            error={Boolean(phoneError)}
                            helperText={phoneError || 'Формат: +79991234567'}
                            placeholder="+79991234567"
                        />
                        <TextField label="Эл. почта" value={form.email} onChange={onChange('email')} fullWidth />
                        <TextField
                            label="Примечание"
                            value={form.description}
                            onChange={onChange('description')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <FormActions saving={saving} onCancel={() => navigate('/carriers')} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
