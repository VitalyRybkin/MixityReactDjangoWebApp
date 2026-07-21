import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Box, CircularProgress, Container, Divider, Stack, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import { sidebarPageSx } from '../../layouts/AppSidebar.jsx'
import Can from '../../pages/auth/components/Can.jsx'
import { GROUPS } from '../../pages/auth/permissions.js'
import { useGetCustomerPrices } from '../customers/utils/customers.queries.js'
import { useGetWarehousePrices } from '../warehouses/utils/stocks.queries.js'

import OrderCustomerFields from './components/OrderCustomerFields.jsx'
import OrderDetailSideBar from './components/OrderDetailSideBar.jsx'
import OrderMainFields from './components/OrderMainFields.jsx'
import OrderPageHeader from './components/OrderPageHeader.jsx'
import OrderProductsList from './components/OrderProductsList.jsx'
import { useLoadingError } from './hooks/useLoadingError.js'
import { useOrderFormData } from './hooks/useOrderFormData.js'
import { useOrderProducts } from './hooks/useOrderProducts.js'
import { useUnsavedGuard } from './hooks/useUnsavedGuard.js'
import { DeliveryContext } from './utils/DeliveryContext.js'
import { emptyDeliveryInfo, emptyOrderForm } from './utils/order.form.constants.js'
import { toOrderPayload } from './utils/order.form.mappers.js'
import { getProductId } from './utils/orderProducts.js'
import { useCreateOrder, useGetOrder, useGetOrderResources, useUpdateOrder } from './utils/orders.queries.js'

export default function OrderFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)

    const [open, setOpen] = useState(false)
    const [orderDelivery, setOrderDelivery] = useState(emptyDeliveryInfo)

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

    const { form, setForm, setError, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm: emptyOrderForm,
        updateMutation: updateOrder,
        createMutation: createOrder,
        redirectPath: '/',
        toPayload: (form) => {
            return {
                ...toOrderPayload(form),
                products: buildProductsPayload(orderProducts),
                delivery: {
                    ...orderDelivery,
                    carrier: orderDelivery.carrier?.id ?? null,
                    driver: orderDelivery.driver?.id ?? null,
                    truck: orderDelivery.truck?.id ?? null,
                },
            }
        },
        validate: validateProducts,
        onSuccess: () => markCleanRef.current?.(),
    })

    const productIds = useMemo(() => {
        return orderProducts.map(getProductId).filter(Boolean)
    }, [orderProducts])

    const customerId = form.customer?.id ?? null
    const warehouseId = form.warehouse?.id ?? null

    const EMPTY_PRICES = []
    const {
        data: customerPrices = EMPTY_PRICES,
        isLoading: isLoadingCustomerPrices,
        error: loadCustomerPricesError,
    } = useGetCustomerPrices(customerId, productIds)

    const {
        data: warehousePrices = EMPTY_PRICES,
        isLoading: isLoadingWarehousePrices,
        error: loadWarehousePricesError,
    } = useGetWarehousePrices(warehouseId, productIds)

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

    const deliveryInitialized = useRef(false)

    useEffect(() => {
        if (order && !deliveryInitialized.current) {
            const delivery = order.order_delivery ?? order.delivery
            if (delivery) setOrderDelivery(delivery)
            deliveryInitialized.current = true
        }
    }, [order])

    useLoadingError(setError, {
        loadResourceError,
        loadOrderError,
        loadCustomerPricesError,
        loadWarehousePricesError,
    })

    // TODO Write a hook for this
    //     const handleDownloadUpd = (orderId) => {
    //         console.log('download or generate upd', orderId)
    //     }

    const deliveryContextValue = useMemo(
        () => ({
            data: orderDelivery,
            update: (newData) => setOrderDelivery((prev) => ({ ...prev, ...newData })),
        }),
        [orderDelivery],
    )
    return (
        <DeliveryContext.Provider value={deliveryContextValue}>
            <Box sx={sidebarPageSx.page}>
                <Can group={GROUPS.LOGISTIC_MANAGER}>
                    <OrderDetailSideBar
                        isEdit={isEdit}
                        open={open}
                        setOpen={setOpen}
                        customerPrices={customerPrices}
                        loadingCustomerPrices={isLoadingCustomerPrices}
                        warehousePrices={warehousePrices}
                        loadingWarehousePrices={isLoadingWarehousePrices}
                        orderProducts={orderProducts}
                        setOrderProducts={setOrderProducts}
                        orderResources={orderResources}
                        form={form}
                        setForm={setForm}
                    />
                </Can>

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
                                    <CircularProgress aria-label="Загрузка..." />
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
                                            // onDownloadUpd={handleDownloadUpd}
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
        </DeliveryContext.Provider>
    )
}
