import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Divider, Stack, TextField } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'

import OrderCustomerFields from './components/OrderCustomerFields.jsx'
import OrderMainFields from './components/OrderMainFields.jsx'
import OrderPageHeader from './components/OrderPageHeader.jsx'
import OrderProductsList from './components/OrderProductsList.jsx'
import { emptyOrderForm } from './order.form.constants.js'
import { mapOrderToForm, toOrderPayload } from './order.form.mappers.js'
import { useCreateOrder, useGetOrder, useGetOrderResources, useUpdateOrder } from './orders.queries.js'

const emptyProductRow = () => ({
    id: crypto.randomUUID(),
    productId: '',
    quantity: '',
    pack_type: '',
})

export default function OrderFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const {
        data: orderResources,
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
        emptyForm: emptyOrderForm,
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
        if (!isEdit || !order || !orderResources) return

        setForm(mapOrderToForm(order, orderResources))
    }, [isEdit, order, orderResources, setForm])

    const isLoadingPage = loadingResources || !orderResources || (isEdit && (loadingOrder || !order))

    const pageLoadError = loadResourceError || loadOrderError

    const [orderProducts, setOrderProducts] = useState([])

    const handleAddProductRow = () => {
        setOrderProducts((prev) => [...prev, emptyProductRow()])
    }

    const handleProductChange = (rowId, field, value) => {
        setOrderProducts((prev) => prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)))
    }

    const handleRemoveProductRow = (rowId) => {
        setOrderProducts((prev) => prev.filter((row) => row.id !== rowId))
    }

    const handleDownloadUpd = (orderId) => {
        console.log('download or generate upd', orderId)
    }

    return (
        <Box sx={{ p: 3, width: '100%' }}>
            <AppBreadcrumbs />

            <form onSubmit={onSubmit}>
                <OrderPageHeader isEdit={isEdit} orderId={form.id} saving={saving} onCancel={() => navigate('/')} />
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
                        <Stack spacing={2} direction="row" sx={{ alignItems: 'stretch' }}>
                            <OrderMainFields
                                form={form}
                                setForm={setForm}
                                onChange={onChange}
                                orderResources={orderResources}
                                isEdit={isEdit}
                                order={order}
                                onDownloadUpd={handleDownloadUpd}
                            />

                            <OrderCustomerFields form={form} setForm={setForm} orderResources={orderResources} />
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
                <OrderProductsList
                    rows={orderProducts}
                    productsList={orderResources?.products || []}
                    onAdd={handleAddProductRow}
                    onChange={handleProductChange}
                    onRemove={handleRemoveProductRow}
                />{' '}
            </form>
        </Box>
    )
}
