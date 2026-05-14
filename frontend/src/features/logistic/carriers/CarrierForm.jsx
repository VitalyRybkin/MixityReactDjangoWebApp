import React, { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import FormActions from '../../../components/ui/FormActions.jsx'
import { useFormLogic } from '../../../hooks/useEntityForm.js'
import { EMAIL_HINT } from '../../../utils/email.js'

import { useCreateCarrier, useGetCarrier, useUpdateCarrier } from './utils/carriers.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
    description: '',
}

export default function CarrierFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const location = useLocation()
    const backPath = location.state?.from || '/'

    const { data: carrier, isPending: loadingCarrier, error: loadError } = useGetCarrier(id)
    const createCarrier = useCreateCarrier()
    const updateCarrier = useUpdateCarrier()

    const saving = createCarrier.isPending || updateCarrier.isPending

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setPhoneError('')
            setEmailError('')
            return
        }

        if (carrier) {
            setForm({
                name: carrier.name ?? '',
                organization: carrier.organization ?? '',
                address: carrier.address ?? '',
                phone: carrier.phone ?? '',
                email: carrier.email ?? '',
                description: carrier.description ?? '',
            })
            setPhoneError('')
            setEmailError('')
        }
    }, [carrier, isEdit])

    useEffect(() => {
        if (loadError) {
            setError(loadError?.response?.data?.detail || 'Ошибка загрузки данных')
        }
    }, [loadError])

    const { form, setForm, error, setError, phoneError, setPhoneError, emailError, setEmailError, onChange, onSubmit } =
        useFormLogic({
            isEdit,
            id,
            emptyForm,
            updateMutation: updateCarrier,
            createMutation: createCarrier,
            redirectPath: '/carriers',
        })

    if (isEdit && loadingCarrier) return <CircularProgress />

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={{ id: carrier?.name }} />
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать ${form.organization || ''}` : 'Создать грузоперевозчика'}
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
                            value={form.organization}
                            onChange={onChange('organization')}
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
                        <TextField
                            label="Эл. почта"
                            value={form.email}
                            onChange={onChange('email')}
                            error={Boolean(emailError)}
                            helperText={emailError || EMAIL_HINT}
                            placeholder="name@example.com"
                            fullWidth
                        />
                        <TextField
                            label="Примечание"
                            value={form.description}
                            onChange={onChange('description')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <FormActions saving={saving} onCancel={() => navigate(backPath)} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
