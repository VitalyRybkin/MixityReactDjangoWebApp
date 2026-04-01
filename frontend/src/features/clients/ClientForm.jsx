import React, { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import FormActions from '../../components/ui/FormActions.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import { EMAIL_HINT } from '../../utils/email.js'

import { useCreateClient, useGetClient, useUpdateClient } from './clients.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
}

export default function ClientFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const location = useLocation()
    const backPath = location.state?.from || '/'

    const { data: client, isPending: loadingClient, error: loadError } = useGetClient(id)
    const createClient = useCreateClient()
    const updateClient = useUpdateClient()

    const saving = createClient.isPending || updateClient.isPending

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setPhoneError('')
            setEmailError('')
            return
        }

        if (client) {
            setForm({
                name: client.name ?? '',
                organization: client.organization ?? '',
                address: client.address ?? '',
                phone: client.phone ?? '',
                email: client.email ?? '',
            })
            setPhoneError('')
            setEmailError('')
        }
    }, [client, isEdit])

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
            updateMutation: updateClient,
            createMutation: createClient,
            redirectPath: '/clients',
        })

    if (isEdit && loadingClient) return <CircularProgress />

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={{ id: client?.name }} />
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать ${form.organization || ''}` : 'Создать клиента'}
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
                            label="Наименование организации"
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

                        <FormActions saving={saving} onCancel={() => navigate(backPath)} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
