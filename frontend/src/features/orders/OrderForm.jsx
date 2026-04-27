import React, { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
    Alert,
    Autocomplete,
    Box,
    Checkbox,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { TimePicker } from '@mui/x-date-pickers'

import dayjs from 'dayjs'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import FormActions from '../../components/ui/FormActions.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import DownAction from '../../components/ui/buttons/DownAction.jsx'
import ViewAction from '../../components/ui/buttons/ViewAction.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'

import { getProductColumns, localeText } from './order.columns.jsx'
import { useCreateOrder, useGetOrder, useGetOrderResources, useUpdateOrder } from './orders.queries.js'

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
    samples: false,
}

const orderStatus = {
    draft: 'Черновик',
    created: 'Создан',
    in_progress: 'В работе',
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

const toTimeValue = (time) => {
    if (!time) return null

    return dayjs(`1970-01-01T${time}`)
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

    const {
        data: order_resources,
        isPending: loadingResources,
        error: loadResourceError,
        refetch,
    } = useGetOrderResources({ enabled: true })

    const {
        data: order,
        isPending: loadingOrder,
        error: loadOrderError,
        refetch: refetchOrder,
    } = useGetOrder(id, { enabled: isEdit })

    const createOrder = useCreateOrder()
    const updateOrder = useUpdateOrder()

    const saving = createOrder.isPending || updateOrder.isPending

    const { form, setForm, error, setError, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm,
        updateMutation: updateOrder,
        createMutation: createOrder,
        redirectPath: '/',
        toPayload: toOrderPayload,
    })

    useEffect(() => {
        if (loadResourceError) {
            setError(loadResourceError?.response?.data?.detail || 'Ошибка загрузки данных')
            return
        }

        if (loadOrderError) {
            setError(loadOrderError?.response?.data?.detail || 'Ошибка загрузки заказа')
        }
    }, [loadResourceError, loadOrderError, setError])

    useEffect(() => {
        if (!isEdit || !order || !order_resources) return

        const customerId = order.customer?.id ?? order.customer ?? null
        const customerObjectId = order.customer_object?.id ?? order.customer_object ?? null

        const selectedCustomer = order_resources.customers?.find((customer) => customer.id === customerId) ?? null

        const selectedCustomerObject =
            selectedCustomer?.customer_objects?.find((obj) => obj.id === customerObjectId) ?? null

        const contactIds = new Set(
            (order.contacts ?? []).map((contact) => (typeof contact === 'object' ? contact.id : contact)),
        )

        const selectedContacts = selectedCustomer?.contacts?.filter((contact) => contactIds.has(contact.id)) ?? []

        setForm({
            id: order.id ?? '',
            status: order.status ?? 'draft',
            created_at: order.created_at ?? '',
            delivery_date: order.delivery_date ?? '',
            delivery_from: toTimeValue(order.delivery_from),
            delivery_to: toTimeValue(order.delivery_to),

            client: order.client?.id ?? order.client ?? '',

            customer: selectedCustomer,
            customer_object: selectedCustomerObject,
            contacts: selectedContacts,

            description: order.description ?? '',

            samples: order.samples ?? false,
        })
    }, [isEdit, order, order_resources, setForm])

    const isLoadingPage = loadingResources || !order_resources || (isEdit && (loadingOrder || !order))

    const pageLoadError = loadResourceError || loadOrderError

    const handleClick = (event) => {
        event.stopPropagation()

        if (order.upd_pdf) {
            window.open(params.row.udp_pdf, '_blank')
        } else {
            console.log('download or generate udp')
        }
    }

    const columns = useMemo(() => getProductColumns(), [])

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
                        {isEdit ? `РЕДАКТИРОВАНИЕ ЗАЯВКИ № ${form.id || ''}` : 'СОЗДАНИЕ ЗАЯВКИ'}
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

                {pageLoadError ? (
                    <ErrorState
                        error={pageLoadError}
                        onRetry={() => {
                            refetch()
                            if (isEdit) refetchOrder()
                        }}
                        loading={loadingResources || loadingOrder}
                    />
                ) : isLoadingPage ? (
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
                                            value={form.delivery_date || ''}
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
                                            onChange={(newValue) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    delivery_from: newValue,
                                                }))
                                            }}
                                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                        />

                                        <TimePicker
                                            label="до:"
                                            ampm={false}
                                            format="HH:mm"
                                            value={form.delivery_to || null}
                                            onChange={(newValue) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    delivery_to: newValue,
                                                }))
                                            }}
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
                                            <MenuItem value="">Не выбран</MenuItem>

                                            {order_resources.clients.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'start',
                                            gap: 2,
                                            mt: 2,
                                            mb: 1,
                                            alignItems: 'center',
                                        }}
                                    >
                                        {isEdit &&
                                            (order.udp_pdf ? (
                                                <ViewAction
                                                    title="Просмотр УПД"
                                                    onClick={() => window.open(order.udp_pdf, '_blank')}
                                                />
                                            ) : (
                                                <DownAction
                                                    title="Загрузить УПД"
                                                    onClick={() => handleDownload(order.id)}
                                                />
                                            ))}
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={form.samples}
                                                    onChange={(e) => setForm({ ...form, samples: e.target.checked })}
                                                />
                                            }
                                            label="Образцы"
                                            slotProps={{
                                                typography: { sx: { fontSize: '0.9rem', color: 'text.secondary' } },
                                            }}
                                            sx={{
                                                '& .MuiFormControlLabel-label': { fontSize: '0.9rem' },
                                            }}
                                        />
                                    </Box>
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
                                    options={order_resources.customers || []}
                                    getOptionLabel={(option) => option?.name || ''}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={form.customer || null}
                                    onChange={(event, newValue) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            customer: newValue,
                                            customer_object: null,
                                            contacts: [],
                                        }))
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
                                        setForm((prev) => ({
                                            ...prev,
                                            customer_object: newValue,
                                        }))
                                    }}
                                    disabled={!form.customer}
                                    renderInput={(params) => <TextField {...params} label="Объект / Адрес" />}
                                    noOptionsText="Нет объектов для этого заказчика"
                                />

                                <Autocomplete
                                    multiple
                                    options={form.customer?.contacts || []}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={form.contacts || []}
                                    onChange={(event, newValue) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            contacts: newValue,
                                        }))
                                    }}
                                    disabled={!form.customer}
                                    getOptionLabel={(option) => {
                                        if (!option || typeof option !== 'object') return ''

                                        const name = `${option.firstName || ''} ${option.lastName || ''}`.trim()
                                        const phones =
                                            option.phoneNumbers?.map((phone) => phone.phoneNumber).join(', ') || ''

                                        return `${name}${phones ? ` - [ ${phones} ]` : ''}`.trim() || 'Без имени'
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Контакты заказчика" />}
                                    noOptionsText="Нет контактов для этого заказчика"
                                />
                            </Box>
                        </Stack>

                        <TextField
                            size="small"
                            label="Примечание"
                            value={form.description || ''}
                            onChange={onChange('description')}
                            multiline
                            rows={2}
                            fullWidth
                            sx={{ mt: 2 }}
                        />
                    </>
                )}
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="h5" color="text.secondary">
                        Продукция
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <AddAction></AddAction>
                    </Stack>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <DataGrid
                    columns={columns}
                    localeText={{ ...localeText, noRowsLabel: 'Добавьте продукцию.' }}
                ></DataGrid>
            </form>
        </Box>
    )
}
