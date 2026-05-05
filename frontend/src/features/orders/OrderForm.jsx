import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Container, Divider, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import { sidebarPageSx } from '../../layouts/AppSidebar.jsx'
import { useGetCustomerPrices } from '../customers/customers.queries.js'

import OrderCustomerFields from './components/OrderCustomerFields.jsx'
import OrderDetailSideBar from './components/OrderDetailSideBar.jsx'
import OrderMainFields from './components/OrderMainFields.jsx'
import OrderPageHeader from './components/OrderPageHeader.jsx'
import OrderProductsList from './components/OrderProductsList.jsx'
import { useOrderFormData } from './hooks/useOrderFormData.js'
import { useOrderProducts } from './hooks/useOrderProducts.js'
import { useUnsavedGuard } from './hooks/useUnsavedGuard.js'
import { emptyOrderForm } from './order.form.constants.js'
import { toOrderPayload } from './order.form.mappers.js'
import { useCreateOrder, useGetOrder, useGetOrderResources, useUpdateOrder } from './orders.queries.js'

export default function OrderFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)

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

    const {
        orderProducts,
        setOrderProducts,
        productErrors,
        totalWeight,
        normalizeOrderProducts,
        buildProductsPayload,
        validate: validateProducts,
        handleAdd: handleAddProductRow,
        handleChange: handleProductChange,
        handleRemove: handleRemoveProductRow,
    } = useOrderProducts(orderResources?.products)

    const markCleanRef = useRef(null)

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
        validate: validateProducts,
        onSuccess: () => markCleanRef.current?.(),
    })

    const productIds = useMemo(() => {
        return orderProducts
            .map((item) => {
                if (!item.productId) return null
                return typeof item.productId === 'object' ? item.productId.id : item.productId
            })
            .filter(Boolean)
    }, [orderProducts])

    const {
        data: customerPrices = [],
        isLoading: isLoadingCustomerPrices,
        error: loadCustomerPricesError,
    } = useGetCustomerPrices(form.customer.id, productIds)

    const isLoadingPage = loadingResources || !orderResources || (isEdit && (loadingOrder || !order))
    const pageLoadError = loadResourceError || loadOrderError

    const { isDirty, markClean } = useOrderFormData({
        isEdit,
        order,
        orderResources,
        isLoadingPage,
        pageLoadError,
        form,
        orderProducts,
        setForm,
        setOrderProducts,
        normalizeOrderProducts,
    })
    markCleanRef.current = markClean

    const { confirmOpen, handleNavigate, handleConfirm, handleCancel } = useUnsavedGuard(isDirty && !saving)

    useEffect(() => {
        if (loadResourceError) {
            setError(loadResourceError?.response?.data?.detail || 'Ошибка загрузки данных')
        } else if (loadOrderError) {
            setError(loadOrderError?.response?.data?.detail || 'Ошибка загрузки заказа')
        }
    }, [loadResourceError, loadOrderError, setError])

    useEffect(() => {
        if (loadCustomerPricesError) {
            setError(loadCustomerPricesError?.response?.data?.detail || 'Ошибка загрузки цен клиента')
        }
    }, [loadCustomerPricesError])

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
                        onClose={handleCancel}
                        onConfirm={handleConfirm}
                    />
                </Container>
            </Box>
        </Box>
    )
}
