import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import FormActions from '../../components/ui/FormActions.jsx'
import { firstError } from '../../utils/apiError.js'
import { EMAIL_HINT, normalizeEmailInput, validateEmailValue } from '../../utils/email.js'
import { normalizePhoneInput, validatePhoneValue } from '../../utils/phone.js'

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

    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [emailError, setEmailError] = useState('')

    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setPhoneError('')
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
        }
    }, [client, error])

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
        if (field === 'email') {
            value = normalizeEmailInput(value)
            setEmailError(validateEmailValue(value))
        }

        setForm((prev) => ({ ...prev, [field]: value }))
    }
    const validateBeforeSubmit = () => {
        const phoneErr = validatePhoneValue(form.phone)

        const emailErr = validateEmailValue(form.email)
        setPhoneError(phoneErr)

        setEmailError(emailErr)
        return !phoneErr && !emailErr
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateBeforeSubmit()) {
            return
        }

        try {
            if (isEdit) {
                await updateClient.mutateAsync({ id, payload: form })
            } else {
                await createClient.mutateAsync(form)
            }
            navigate('/carriers')
        } catch (e2) {
            setError(firstError(e2))
        }
    }

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
