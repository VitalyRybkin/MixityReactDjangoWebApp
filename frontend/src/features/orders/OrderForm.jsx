import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material'

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
    packId: '',
    value: 0,
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

    const [orderProducts, setOrderProducts] = useState([])

    const [productErrors, setProductErrors] = useState({})

    const totalWeight = useMemo(() => {
        return orderProducts.reduce((acc, row) => {
            const product = orderResources?.products?.find((item) => item.id === row.productId)

            const quantity = Number(String(row.quantity).replace(',', '.')) || 0
            const unitValue = Number(product?.product_unit?.value) || 0
            const isPieceBased = !product?.product_unit?.unit?.is_weight_based

            if (!quantity) return acc

            if (isPieceBased) {
                return acc + (quantity * unitValue) / 1000
            }

            return acc + quantity
        }, 0)
    }, [orderProducts, orderResources?.products])

    const normalizeOrderProducts = (items = []) =>
        items.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            productId: item.product?.id || '',
            quantity: item.piece_based_quantity ?? item.weight_quantity ?? '',
            packId: item.pack_type?.id || '',
            value: item.product?.product_unit?.value ?? 0,
        }))

    const buildProductsPayload = () =>
        orderProducts
            .filter((row) => row.productId && row.quantity)
            .map((row) => ({
                product: row.productId,
                quantity: row.quantity,
                package: row.packId || null,
            }))

    const { form, setForm, error, setError, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm: emptyOrderForm,
        updateMutation: updateOrder,
        createMutation: createOrder,
        redirectPath: '/',
        toPayload: (form) => {
            return {
                ...toOrderPayload(form),
                products: buildProductsPayload(),
            }
        },
        validate: () => {
            const errors = {}

            orderProducts.forEach((row) => {
                if (row.productId && (row.quantity === '' || row.quantity == null)) {
                    errors[row.id] = 'Пожалуйста, заполните поле'
                }
            })

            setProductErrors(errors)
            return Object.keys(errors).length === 0
        },
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
        setOrderProducts(normalizeOrderProducts(order.order_products))
    }, [isEdit, order, orderResources, setForm])

    const isLoadingPage = loadingResources || !orderResources || (isEdit && (loadingOrder || !order))

    const pageLoadError = loadResourceError || loadOrderError

    const handleAddProductRow = () => {
        setOrderProducts((prev) => [...prev, emptyProductRow()])
    }
    const handleProductChange = (rowId, updates) => {
        setOrderProducts((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)))

        if ('quantity' in updates && updates.quantity !== '') {
            setProductErrors((prev) => {
                const next = { ...prev }
                delete next[rowId]
                return next
            })
        }
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

            <form noValidate onSubmit={onSubmit}>
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
                {!pageLoadError && !isLoadingPage && (
                    <OrderProductsList
                        rows={orderProducts}
                        productErrors={productErrors}
                        productsList={orderResources?.products || []}
                        packsList={orderResources?.pack_types || []}
                        onAdd={handleAddProductRow}
                        onChange={handleProductChange}
                        onRemove={handleRemoveProductRow}
                    />
                )}{' '}
            </form>
            <Divider sx={{ mb: 1, mt: 2 }} />
            <Stack direction="row" justifyContent="start" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ m: 1 }}>
                    Вес:
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {totalWeight.toFixed(2)} т
                </Typography>
            </Stack>
        </Box>
    )
}
