import React, { useEffect, useState } from 'react'
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
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import CancelAction from '../../components/ui/buttons/CancelAction.jsx'
import SaveAction from '../../components/ui/buttons/SaveAction.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'

import { useCreateOrder, useGetOrder, useGetOrderResources, useUpdateOrder } from './orders.queries.js'

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const emptyForm = {
    id: '',
    created_at: '',
    delivery_date: tomorrow.toISOString().split('T')[0],
    client: '',
    customer: '',
    status: 'Черновик',
}

const orderStatus = {
    Черновик: 'draft',
    Создан: 'created',
    'В процессе': 'in_progress',
    Завершен: 'completed',
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
    gap: 2,
    '&:hover': {
        borderColor: 'text.secondary',
    },
}

export default function OrderFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: order_resources, isPending: loadingOrder, error: loadError, refetch } = useGetOrderResources()

    const createOrder = useCreateOrder()
    const updateOrder = useUpdateOrder()

    const [client, setClient] = useState('')
    const [customer, setCustomer] = useState(null)
    const [objects, setObjects] = useState(null)
    const [contacts, setContacts] = useState(null)
    const [status, setStatus] = useState('Черновик')

    const saving = createOrder.isPending || updateOrder.isPending

    const { form, setForm, error, setError, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm,
        updateMutation: updateOrder,
        createMutation: createOrder,
        redirectPath: '/',
    })
    //
    // useEffect(() => {
    //     if (!isEdit) {
    //         setForm(emptyForm)
    //         return
    //     }
    // })

    return (
        <Box sx={{ pt: 1, px: 3, pb: 3 }}>
            <AppBreadcrumbs />
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0 }}>
                    <Typography variant="h5" color="text.secondary" sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}>
                        {isEdit ? `Редактировать заказ №${form.id || ''}` : 'Создать заказ'}
                    </Typography>
                    <SaveAction onClick={() => navigate('/')} />
                    <CancelAction onClick={() => navigate('/')} />
                </Stack>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            <Divider sx={{ mb: 3 }} />

            {loadError ? (
                <ErrorState error={error} onRetry={refetch} loading={loadingOrder} />
            ) : loadingOrder ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {' '}
                    <Stack spacing={2} direction="row" sx={{ mb: 0, alignItems: 'flex-start' }}>
                        <Stack spacing={2} sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="Дата доставки"
                                    type="date"
                                    size="small"
                                    value={form.delivery_date}
                                    onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                                />
                                <FormControl variant="outlined" size="small" sx={{ flexGrow: 1 }}>
                                    <InputLabel id="status-label">Статус</InputLabel>
                                    <Select
                                        labelId="status-label"
                                        label="Статус"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        {Object.keys(orderStatus).map((item) => (
                                            <MenuItem key={item} value={item}>
                                                {item}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>

                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel id="client-label">Клиент</InputLabel>
                                <Select
                                    labelId="client-label"
                                    label="Клиент"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                >
                                    {(order_resources?.clients || []).map((item) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>

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
                                Данные заказчика
                            </Typography>

                            <Autocomplete
                                size="small"
                                options={order_resources?.customers || []}
                                getOptionLabel={(option) => option.name || ''}
                                value={customer}
                                onChange={(event, newValue) => {
                                    setCustomer(newValue)
                                    setObjects(null)
                                    setContacts(null)
                                }}
                                renderInput={(params) => <TextField {...params} label="Заказчик" />}
                            />
                            <Autocomplete
                                size="small"
                                options={customer?.customer_objects || []}
                                getOptionLabel={(option) => (option ? `${option.name} [ ${option.address} ]` : '')}
                                value={objects}
                                onChange={(event, newValue) => setObjects(newValue)}
                                disabled={!customer}
                                renderInput={(params) => <TextField {...params} label="Объект / Адрес" />}
                            />
                            <Autocomplete
                                size="small"
                                options={customer?.contacts || []}
                                getOptionLabel={(option) =>
                                    option
                                        ? `${option.firstName} ${option.lastName} - [ ${option.phoneNumbers.join(', ')} ]`
                                        : ''
                                }
                                value={contacts}
                                onChange={(event, newValue) => setContacts(newValue)}
                                disabled={!customer}
                                renderInput={(params) => <TextField {...params} label="Контакт" />}
                            />
                        </Box>
                    </Stack>
                </>
            )}
        </Box>
    )
}
