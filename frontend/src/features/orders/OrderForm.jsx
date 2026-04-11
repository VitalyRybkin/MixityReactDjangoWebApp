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
    TextField,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'

import { useCreateOrder, useGetOrder, useGetOrderResources, useUpdateOrder } from './orders.queries.js'

const emptyForm = {
    id: '',
    created_at: '',
    delivery_date: '',
    client: '',
    customer: '',
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
    const [object, setObject] = useState(null)

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
                <Typography variant="h5" color="text.secondary" sx={{ mb: 0 }}>
                    {isEdit ? `Редактировать заявку №${form.id || ''}` : 'Создать заявку'}
                </Typography>

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
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                        <InputLabel htmlFor="client-id-input">Клиент</InputLabel>
                        <Select
                            label="Клиент"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            inputProps={{
                                id: 'client-id-input',
                            }}
                        >
                            {(order_resources?.clients || []).map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                    {item.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Autocomplete
                        options={order_resources?.customers || []}
                        getOptionLabel={(option) => option.name || ''}
                        value={customer}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        onChange={(event, newValue) => {
                            setCustomer(newValue)
                            setObject(null)
                        }}
                        noOptionsText="Заказчик не найден"
                        renderInput={(params) => <TextField {...params} label="Заказчик" />}
                        sx={{ mb: 2 }}
                    />
                    <Autocomplete
                        options={customer?.customer_objects || []}
                        getOptionLabel={(option) => (option ? `${option.name} (${option.address})` : '')}
                        value={object}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        onChange={(event, newValue) => {
                            setObject(newValue)
                        }}
                        disabled={!customer}
                        noOptionsText={customer ? 'У этого заказчика нет объектов' : 'Сначала выберите заказчика'}
                        renderInput={(params) => <TextField {...params} label="Объект / Адрес" />}
                        sx={{ mb: 2 }}
                    />
                </>
            )}
        </Box>
    )
}
