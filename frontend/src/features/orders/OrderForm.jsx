import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Container, Divider, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import { sidebarPageSx } from '../../layouts/AppSidebar.jsx'

import OrderCustomerFields from './components/OrderCustomerFields.jsx'
import OrderDetailSideBar from './components/OrderDetailSideBar.jsx'
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

    const [open, setOpen] = useState(false)

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
    const [initialSnapshot, setInitialSnapshot] = useState(null)

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
        toPayload: (form) => ({
            ...toOrderPayload(form),
            products: buildProductsPayload(),
        }),
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
        onSuccess: () => {
            setInitialSnapshot(
                JSON.stringify({
                    form,
                    products: orderProducts,
                }),
            )
        },
    })

    const isLoadingPage = loadingResources || !orderResources || (isEdit && (loadingOrder || !order))
    const pageLoadError = loadResourceError || loadOrderError

    const currentSnapshot = JSON.stringify({
        form,
        products: orderProducts,
    })

    const isDirty = initialSnapshot !== null && currentSnapshot !== initialSnapshot && !saving

    useEffect(() => {
        const handler = (e) => {
            if (!isDirty) return
            e.preventDefault()
            e.returnValue = ''
        }

        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [isDirty])

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

        const mappedForm = mapOrderToForm(order, orderResources)
        const mappedProducts = normalizeOrderProducts(order.order_products)

        setForm(mappedForm)
        setOrderProducts(mappedProducts)

        setInitialSnapshot(
            JSON.stringify({
                form: mappedForm,
                products: mappedProducts,
            }),
        )
    }, [isEdit, order, orderResources, setForm])

    useEffect(() => {
        if (isEdit || isLoadingPage || pageLoadError || initialSnapshot !== null) return

        setInitialSnapshot(
            JSON.stringify({
                form,
                products: orderProducts,
            }),
        )
    }, [isEdit, isLoadingPage, pageLoadError, initialSnapshot, form, orderProducts])

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [nextPath, setNextPath] = useState(null)

    const handleNavigate = (path) => {
        if (isDirty) {
            setNextPath(path)
            setConfirmOpen(true)
            return
        }

        navigate(path)
    }

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
        <Box sx={sidebarPageSx.page}>
            <OrderDetailSideBar open={open} setOpen={setOpen} />

            <Box sx={{ ...sidebarPageSx.content, ...(open ? sidebarPageSx.contentWithSidebar : {}) }}>
                <Container maxWidth="lg" sx={{ mt: 1 }}>
                    <AppBreadcrumbs />

                    <form noValidate onSubmit={onSubmit}>
                        <OrderPageHeader
                            isEdit={isEdit}
                            orderId={form.id}
                            saving={saving}
                            onCancel={() => handleNavigate('/')}
                        />

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

                                    <OrderCustomerFields
                                        form={form}
                                        setForm={setForm}
                                        orderResources={orderResources}
                                    />
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
                        )}
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

                    <ConfirmDialog
                        open={confirmOpen}
                        title="Есть несохранённые изменения"
                        text="Вы изменили форму. Уйти без сохранения?"
                        confirmText="Уйти"
                        cancelText="Остаться"
                        onClose={() => {
                            setConfirmOpen(false)
                            setNextPath(null)
                        }}
                        onConfirm={() => {
                            const path = nextPath || '/'
                            setConfirmOpen(false)
                            setNextPath(null)
                            navigate(path)
                        }}
                    />
                </Container>
            </Box>
        </Box>
    )
}
