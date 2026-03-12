import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import { firstError } from '../../../utils/apiError.js'
import { EMAIL_HINT, normalizeEmailInput, validateEmailValue } from '../../../utils/email.js'
import { normalizePhoneInput, validatePhoneValue } from '../../../utils/phone.js'

import { useCreateWarehouse, useUpdateWarehouse, useWarehouse } from './stocks.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
    descriptions: '',
}

export default function WarehouseFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: warehouse, isPending: loadingWarehouse, error: loadError } = useWarehouse(id)
    const createWarehouse = useCreateWarehouse()
    const updateWarehouse = useUpdateWarehouse()

    const saving = createWarehouse.isPending || updateWarehouse.isPending

    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setPhoneError('')
            setEmailError('')
            return
        }

        if (warehouse) {
            setForm({
                name: warehouse.name ?? '',
                organization: warehouse.organization ?? '',
                address: warehouse.address ?? '',
                phone: warehouse.phone ?? '',
                email: warehouse.email ?? '',
                descriptions: warehouse.descriptions ?? '',
            })
            setPhoneError('')
            setEmailError('')
        }
    }, [warehouse, isEdit])

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
                await updateWarehouse.mutateAsync({ id, payload: form })
            } else {
                await createWarehouse.mutateAsync(form)
            }
            navigate('/warehouses')
        } catch (e2) {
            setError(firstError(e2))
        }
    }

    if (isEdit && loadingWarehouse) return <CircularProgress />

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={{ id: warehouse?.name }} />
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать ${form.organization || ''}` : 'Создать склад'}
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
                        <TextField
                            label="Примечание"
                            value={form.descriptions}
                            onChange={onChange('descriptions')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/warehouses')} disabled={saving}>
                                Отмена
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
