import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
    Alert,
    Autocomplete,
    Box,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers'

import dayjs from 'dayjs'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import FormActions from '../../components/ui/FormActions.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'

import { useCreateOrder, useGetOrderResources, useUpdateOrder } from './orders.queries.js'

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const emptyForm = {
    id: '',
    created_at: '',
    delivery_date: tomorrow.toISOString().split('T')[0],
    delivery_from: null,
    delivery_to: null,
    client: '',
    customer: null,
    customer_object: null,
    contacts: [],
    status: 'draft',
    description: '',
}

const orderStatus = {
    draft: 'Черновик',
    created: 'Создан',
    in_progress: 'В процессе',
    completed: 'Завершен',
}

const fieldsetStyles = {
    flex: 1,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    p: 2,
    m: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2.1,
    '&:hover': {
        borderColor: 'text.secondary',
    },
}

const toOrderPayload = (form) => ({
    ...form,
    client: form.client || null,
    customer: form.customer?.id ?? null,
    customer_object: form.customer_object?.id ?? null,
    contacts: form.contacts?.map((contact) => contact.id) ?? [],
    delivery_from: form.delivery_from?.format?.('HH:mm') ?? form.delivery_from ?? null,
    delivery_to: form.delivery_to?.format?.('HH:mm') ?? form.delivery_to ?? null,
})

export default function OrderFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: order_resources, isPending: loadingOrder, error: loadError, refetch } = useGetOrderResources()

    const createOrder = useCreateOrder()
    const updateOrder = useUpdateOrder()

    const saving = createOrder.isPending || updateOrder.isPending

    const { form, setForm, error, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm,
        updateMutation: updateOrder,
        createMutation: createOrder,
        redirectPath: '/',
        toPayload: toOrderPayload,
    })

    useEffect(() => {
        if (!isEdit) return

        if (form.delivery_from && typeof form.delivery_from === 'string') {
            setForm((prev) => ({
                ...prev,
                delivery_from: dayjs(prev.delivery_from, 'HH:mm'),
                delivery_to: prev.delivery_to ? dayjs(prev.delivery_to, 'HH:mm') : null,
            }))
        }
    }, [isEdit, form.delivery_from, setForm])

    return (
        <Box sx={{ p: 3, width: '100%' }}>
            <AppBreadcrumbs />
            <form onSubmit={onSubmit}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h4"
                        color="text.secondary"
                        sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}
                        gutterBottom
                        fontWeight={600}
                    >
                        {isEdit ? `Редактировать заказ №${form.id || ''}` : 'Создать заказ'}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                        <FormActions saving={saving} onCancel={() => navigate('/')} />
                    </Stack>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Divider sx={{ mb: 3 }} />

                {loadError ? (
                    <ErrorState error={loadError} onRetry={refetch} loading={loadingOrder} />
                ) : loadingOrder ? (
                    <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Stack spacing={2} direction="row" sx={{ mb: 0, alignItems: 'stretch' }}>
                            <Box component="fieldset" sx={fieldsetStyles}>
                                <Typography
                                    component="legend"
                                    variant="caption"
                                    sx={{
                                        px: 1,
                                        color: 'text.secondary',
                                        fontWeight: 'medium',
                                    }}
                                >
                                    Данные заказа:
                                </Typography>

                                <Stack spacing={2} sx={{ flex: 1 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <TextField
                                            label="Дата доставки"
                                            type="date"
                                            size="small"
                                            value={form.delivery_date}
                                            onChange={onChange('delivery_date')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            sx={{ flex: 1 }}
                                        />

                                        <FormControl variant="outlined" size="small" sx={{ flex: 1 }}>
                                            <InputLabel id="status-label">Статус</InputLabel>
                                            <Select
                                                labelId="status-label"
                                                label="Статус"
                                                value={form.status || ''}
                                                onChange={onChange('status')}
                                            >
                                                {Object.entries(orderStatus).map(([value, label]) => (
                                                    <MenuItem key={value} value={value}>
                                                        {label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <TimePicker
                                            label="Время доставки c:"
                                            ampm={false}
                                            format="HH:mm"
                                            value={form.delivery_from || null}
                                            onChange={onChange('delivery_from')}
                                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                        />

                                        <TimePicker
                                            label="до:"
                                            ampm={false}
                                            format="HH:mm"
                                            value={form.delivery_to || null}
                                            onChange={onChange('delivery_to')}
                                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                        />
                                    </Stack>

                                    <FormControl fullWidth variant="outlined" size="small">
                                        <InputLabel id="client-label">Клиент</InputLabel>
                                        <Select
                                            labelId="client-label"
                                            label="Клиент"
                                            value={form.client || ''}
                                            onChange={onChange('client')}
                                        >
                                            {(order_resources?.clients || []).map((item) => (
                                                <MenuItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Box>

                            <Box component="fieldset" sx={fieldsetStyles}>
                                <Typography
                                    component="legend"
                                    variant="caption"
                                    sx={{
                                        px: 1,
                                        color: 'text.secondary',
                                        fontWeight: 'medium',
                                    }}
                                >
                                    Данные заказчика:
                                </Typography>

                                <Autocomplete
                                    size="small"
                                    options={order_resources?.customers || []}
                                    getOptionLabel={(option) => option?.name || ''}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={form.customer || null}
                                    onChange={(event, newValue) => {
                                        onChange('customer')(newValue)
                                        onChange('customer_object')(null)
                                        onChange('contacts')([])
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Заказчик" />}
                                />

                                <Autocomplete
                                    size="small"
                                    options={form.customer?.customer_objects || []}
                                    getOptionLabel={(option) => (option ? `${option.name} [ ${option.address} ]` : '')}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={form.customer_object || null}
                                    onChange={(event, newValue) => {
                                        onChange('customer_object')(newValue)
                                    }}
                                    disabled={!form.customer}
                                    renderInput={(params) => <TextField {...params} label="Объект / Адрес" />}
                                    noOptionsText={'Нет объектов для этого заказчика'}
                                />

                                <Autocomplete
                                    multiple
                                    options={form.customer?.contacts || []}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={form.contacts || []}
                                    onChange={(event, newValue) => onChange('contacts')(newValue)}
                                    disabled={!form.customer}
                                    getOptionLabel={(option) => {
                                        if (!option || typeof option !== 'object') return ''

                                        const name = `${option.firstName || ''} ${option.lastName || ''}`.trim()
                                        const phones =
                                            option.phoneNumbers?.map((phone) => phone.phoneNumber).join(', ') || ''

                                        return `${name}${phones ? ` - [ ${phones} ]` : ''}`.trim() || 'Без имени'
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Контакты заказчика" />}
                                    noOptionsText={'Нет контактов для этого заказчика'}
                                />
                            </Box>
                        </Stack>

                        <TextField
                            size="small"
                            label="Примечание"
                            value={form.description || ''}
                            onChange={onChange('description')}
                            multiline
                            rows={4}
                            fullWidth
                            sx={{ mt: 2 }}
                        />
                    </>
                )}
            </form>
        </Box>
    )
}
