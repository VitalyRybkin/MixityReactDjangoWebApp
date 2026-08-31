import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Box, CircularProgress, Container, Divider, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import { useFileUpload } from '../../hooks/useUploadFile.js'
import { sidebarPageSx } from '../../layouts/AppSidebar.jsx'
import Can from '../../pages/auth/components/Can.jsx'
import { GROUPS } from '../../pages/auth/permissions.js'
import { useGetCustomerPrices } from '../customers/utils/customers.queries.js'
import { useGetWarehousePrices } from '../warehouses/utils/stocks.queries.js'

import { getOrderFormContentSx, orderFormSx as sx } from './OrderForm.styles.js'
import OrderCustomerFields from './components/OrderCustomerFields.jsx'
import OrderDetailSideBar from './components/OrderDetailSideBar.jsx'
import OrderMainFields from './components/OrderMainFields.jsx'
import OrderPageHeader from './components/OrderPageHeader.jsx'
import OrderProductsList from './components/OrderProductsList.jsx'
import { useLoadingError } from './hooks/useLoadingError.js'
import { useOrderFormData } from './hooks/useOrderFormData.js'
import { useOrderProducts } from './hooks/useOrderProducts.js'
import { useUnsavedGuard } from './hooks/useUnsavedGuard.js'
import { useViewUpd } from './hooks/useViewUpd.js'
import { DeliveryContext } from './utils/DeliveryContext.js'
import { emptyDeliveryInfo, emptyOrderForm } from './utils/order.form.constants.js'
import { toOrderPayload } from './utils/order.form.mappers.js'
import { getProductId } from './utils/orderProducts.js'
import {
    useCreateOrder,
    useGetOrder,
    useGetOrderResources,
    useUpdateOrder,
    useUploadUpd,
} from './utils/orders.queries.js'

const EMPTY_PRICES = []

export default function OrderFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)

    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const [orderDelivery, setOrderDelivery] = useState(emptyDeliveryInfo)

    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

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
    const uploadUpd = useUploadUpd({
        onSuccess: () => navigate('/'),
    })

    const handleUploadUpd = useFileUpload(uploadUpd, showSnackbar, {
        successMessage: 'УПД успешно загружен.',
        deleteSuccessMessage: 'УПД успешно удалён.',
        errorMessage: 'Не удалось изменить УПД.',
    })

    const handleViewUpd = useViewUpd(showSnackbar)

    const saving = createOrder.isPending || updateOrder.isPending || uploadUpd.isPending

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
        toPayload: (form) => ({
            ...toOrderPayload(form),
            products: buildProductsPayload(orderProducts),
            delivery: {
                ...orderDelivery,
                carrier: orderDelivery.carrier?.id ?? null,
                driver: orderDelivery.driver?.id ?? null,
                truck: orderDelivery.truck?.id ?? null,
            },
        }),
        validate: validateProducts,
        onSuccess: () => markCleanRef.current?.(),
    })

    const productIds = useMemo(() => orderProducts.map(getProductId).filter(Boolean), [orderProducts])

    const customerId = form.customer?.id ?? null
    const warehouseId = form.warehouse?.id ?? null

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

    const { confirmOpen, handleConfirm, handleCancel } = useUnsavedGuard(isDirty && !saving)

    const deliveryInitialized = useRef(false)

    useEffect(() => {
        if (order && !deliveryInitialized.current) {
            const delivery = order.order_delivery ?? order.delivery

            if (delivery) {
                setOrderDelivery(delivery)
            }

            deliveryInitialized.current = true
        }
    }, [order])

    useLoadingError(setError, {
        loadResourceError,
        loadOrderError,
        loadCustomerPricesError,
        loadWarehousePricesError,
    })

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

                <Box sx={getOrderFormContentSx(open)}>
                    <Container maxWidth="lg" sx={sx.container}>
                        <AppBreadcrumbs />

                        <Box component="form" noValidate onSubmit={onSubmit} sx={sx.form}>
                            <Box sx={sx.header}>
                                <OrderPageHeader isEdit={isEdit} orderId={form.id} saving={saving} />
                            </Box>

                            <Divider sx={sx.divider} />

                            {pageLoadError ? (
                                <ErrorState
                                    error={pageLoadError}
                                    onRetry={() => {
                                        refetch()
                                        if (isEdit) {
                                            refetchOrder()
                                        }
                                    }}
                                    loading={loadingResources || loadingOrder}
                                />
                            ) : isLoadingPage ? (
                                <Box sx={sx.loading}>
                                    <CircularProgress aria-label="Загрузка..." />
                                </Box>
                            ) : (
                                <>
                                    <Box sx={sx.mainFields}>
                                        <OrderMainFields
                                            form={form}
                                            setForm={setForm}
                                            onChange={onChange}
                                            orderResources={orderResources}
                                            isEdit={isEdit}
                                            order={order}
                                            onDownloadUpd={handleUploadUpd}
                                            onViewUpd={handleViewUpd}
                                        />

                                        <OrderCustomerFields
                                            form={form}
                                            setForm={setForm}
                                            orderResources={orderResources}
                                        />
                                    </Box>

                                    <TextField
                                        size="small"
                                        label="Примечание"
                                        value={form.description || ''}
                                        onChange={onChange('description')}
                                        multiline
                                        rows={2}
                                        fullWidth
                                        sx={sx.note}
                                    />
                                </>
                            )}

                            {!pageLoadError && !isLoadingPage && (
                                <Box sx={sx.products}>
                                    <OrderProductsList
                                        rows={orderProducts}
                                        productErrors={productErrors}
                                        productsList={orderResources?.products || []}
                                        packsList={orderResources?.pack_types || []}
                                        onAdd={handleAddProductRow}
                                        onChange={handleProductChange}
                                        onRemove={handleRemoveProductRow}
                                    />
                                </Box>
                            )}
                        </Box>

                        <Divider sx={sx.bottomDivider} />

                        <Box sx={sx.weight}>
                            <Typography variant="body1" color="text.secondary" sx={sx.weightLabel}>
                                Вес:
                            </Typography>

                            <Typography variant="body1" color="text.secondary">
                                {totalWeight.toFixed(2)} т
                            </Typography>
                        </Box>

                        <ConfirmDialog
                            open={confirmOpen}
                            title="Есть несохранённые изменения"
                            text="Вы изменили форму. Уйти без сохранения?"
                            confirmText="Уйти"
                            cancelText="Остаться"
                            onClose={handleCancel}
                            onConfirm={handleConfirm}
                        />

                        <AppSnackbar
                            open={snack.open}
                            message={snack.message}
                            severity={snack.severity}
                            onClose={closeSnackbar}
                        />
                    </Container>
                </Box>
            </Box>
        </DeliveryContext.Provider>
    )
}
