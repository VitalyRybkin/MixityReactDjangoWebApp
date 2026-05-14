import React, { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import FormActions from '../../components/ui/FormActions.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import useLoadImage from '../../hooks/useLoadImage.jsx'
import { EMAIL_HINT } from '../../utils/email.js'

import { useCreateWarehouse, useUpdateWarehouse, useWarehouse } from './utils/stocks.queries.js'

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
    const location = useLocation()
    const backPath = location.state?.from || '/'

    const { data: warehouse, isPending: loadingWarehouse, error: loadError } = useWarehouse(id)
    const createWarehouse = useCreateWarehouse()
    const updateWarehouse = useUpdateWarehouse()

    const saving = createWarehouse.isPending || updateWarehouse.isPending

    const { renderActions } = useLoadImage()

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
                directions: warehouse.directions ?? '',
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

    const { form, setForm, error, setError, phoneError, setPhoneError, emailError, setEmailError, onChange, onSubmit } =
        useFormLogic({
            isEdit,
            id,
            emptyForm,
            updateMutation: updateWarehouse,
            createMutation: createWarehouse,
            redirectPath: '/warehouses',
        })

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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Схема проезда
                            </Typography>
                            {renderActions(
                                form?.directions,
                                `/warehouses/${warehouse?.id}/map`,
                                warehouse?.directions,
                                { state: { warehouse: warehouse?.name } },
                            )}
                        </Box>

                        <FormActions saving={saving} onCancel={() => navigate(backPath)} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
