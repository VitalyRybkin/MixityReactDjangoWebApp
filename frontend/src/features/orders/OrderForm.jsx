import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    TextField,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeaderCreateUpdate from '../../components/PageHeaderCreateUpdate.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import { useFileUpload } from '../../hooks/useUploadFile.js'
import { sidebarPageSx } from '../../layouts/AppSidebar.styles.js'
import { useGetCustomerPrices } from '../customers/utils/customers.queries.js'
import { useGetWarehousePrices } from '../warehouses/utils/stocks.queries.js'

import { getOrderFormContentSx, orderFormSx as sx } from './OrderForm.styles.js'
import OrderCustomerFields from './components/OrderCustomerFields.jsx'
import OrderDetailSideBar from './components/OrderDetailSideBar.jsx'
import OrderMainFields from './components/OrderMainFields.jsx'
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

const formatTons = (value) => {
    const number = Number(value)
    return Number.isFinite(number)
        ? `${number.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} т`
        : '—'
}

const getEntityId = (value) => {
    if (value == null) {
        return null
    }

    return typeof value === 'object' ? (value.id ?? null) : value
}

export default function OrderFormPage({ readOnly = false }) {
    const { id } = useParams()
    const isEdit = Boolean(id)

    const [open, setOpen] = useState(false)
    const [orderDelivery, setOrderDelivery] = useState(emptyDeliveryInfo)
    const [passportConflict, setPassportConflict] = useState(null)
    const formRef = useRef(null)
    const confirmedPassportIdsRef = useRef([])

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

    const showPassportSaveConflict = (error) => {
        const response = error?.response?.data
        const conflict = response?.errors ?? response?.detail ?? response
        const code = conflict?.code ?? conflict?.detail?.code

        if (code === 'passport_limit_exceeded') {
            const passports = conflict?.passports ?? conflict?.detail?.passports ?? []
            if (Array.isArray(passports) && passports.length) {
                setPassportConflict(passports)
                return
            }
            showSnackbar('Количество паспорта превышено. Проверьте данные и повторите сохранение.', 'warning')
            return
        }

        if (code === 'passport_changed') {
            showSnackbar('Действующий паспорт изменился. Проверьте данные паспорта и повторите сохранение.', 'warning')
            return
        }

        showSnackbar(
            'Не удалось сохранить заявку из-за конфликта данных. Обновите информацию и повторите сохранение.',
            'warning',
        )
    }

    const handleKeepOverrun = () => {
        const ids = (passportConflict ?? [])
            .map((passport) => Number(passport.passport_id))
            .filter((passportId) => Number.isInteger(passportId) && passportId > 0)

        if (!ids.length) {
            showSnackbar('Не удалось определить паспорта для подтверждения.', 'error')
            return
        }

        setPassportConflict(null)
        confirmedPassportIdsRef.current = [...new Set(ids)]

        formRef.current?.requestSubmit()
    }

    const createOrder = useCreateOrder({ onPassportConflict: showPassportSaveConflict })
    const updateOrder = useUpdateOrder({ onPassportConflict: showPassportSaveConflict })
    const uploadUpd = useUploadUpd()

    const handleUploadUpd = useFileUpload(uploadUpd, showSnackbar, {
        successMessage: 'УПД успешно загружен.',
        deleteSuccessMessage: 'УПД успешно удалён.',
        errorMessage: 'Не удалось изменить УПД.',
    })

    const handleViewUpd = useViewUpd(showSnackbar)

    const saving = createOrder.isPending || updateOrder.isPending || uploadUpd.isPending
    const controlsReadOnly = readOnly || saving

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

    const { form, setForm, error: formError, setError, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm: emptyOrderForm,
        updateMutation: updateOrder,
        createMutation: createOrder,
        redirectPath: '/',
        toPayload: (currentForm) => {
            const confirmedIds = confirmedPassportIdsRef.current
            confirmedPassportIdsRef.current = []

            return {
                ...toOrderPayload(currentForm),
                ...(confirmedIds.length ? { confirmed_passport_ids: confirmedIds } : {}),
                products: buildProductsPayload(orderProducts),
                delivery: {
                    ...orderDelivery,
                    carrier: getEntityId(orderDelivery.carrier),
                    driver: getEntityId(orderDelivery.driver),
                    truck: getEntityId(orderDelivery.truck),
                },
            }
        },
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
        orderDelivery,
        setForm,
        setOrderProducts,
        setOrderDelivery,
        normalizeOrderProducts,
    })

    markCleanRef.current = markClean

    const { confirmOpen, handleConfirm, handleCancel } = useUnsavedGuard(!readOnly && isDirty && !saving)

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
            <Box sx={sidebarPageSx.page} inert={saving ? '' : undefined} aria-busy={saving}>
                <OrderDetailSideBar
                    readOnly={controlsReadOnly}
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

                <Box sx={getOrderFormContentSx(open)}>
                    <Container maxWidth="lg" sx={sx.container}>
                        <AppBreadcrumbs />

                        <Box
                            component="form"
                            ref={formRef}
                            noValidate
                            onSubmit={(event) => {
                                if (readOnly || saving) {
                                    event.preventDefault()
                                    return
                                }
                                onSubmit(event)
                            }}
                            sx={sx.form}
                        >
                            <Box sx={sx.header}>
                                <PageHeaderCreateUpdate
                                    isEdit={isEdit}
                                    orderId={form.id}
                                    saving={saving}
                                    saveDisabled={readOnly || (isEdit && !isDirty)}
                                    newOrder="Создание заявки"
                                    editOrder={readOnly ? 'Просмотр заявки' : 'Редактирование заявки'}
                                />
                            </Box>

                            <Divider sx={sx.divider} />

                            {formError && !pageLoadError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {formError}
                                </Alert>
                            )}

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
                                            readOnly={controlsReadOnly}
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
                                            readOnly={controlsReadOnly}
                                            form={form}
                                            setForm={setForm}
                                            orderResources={orderResources}
                                            refetchOrderResources={refetch}
                                        />
                                    </Box>

                                    <TextField
                                        disabled={controlsReadOnly}
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
                                        readOnly={controlsReadOnly}
                                        rows={orderProducts}
                                        productErrors={productErrors}
                                        productsList={orderResources?.products || []}
                                        packsList={orderResources?.pack_types || []}
                                        orderId={isEdit ? id : null}
                                        targetStatus={form.status}
                                        deliveryDate={form.delivery_date}
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

                        <Dialog
                            open={Boolean(passportConflict)}
                            onClose={() => setPassportConflict(null)}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle sx={{ pb: 2, fontSize: '1.2rem', fontWeight: 600 }}>
                                Превышение количества по паспортам:
                            </DialogTitle>
                            <DialogContent sx={{ pt: '8px !important', pb: '4px !important' }}>
                                <Box component="ul" sx={{ pl: 3.5, my: 0, '& > li:not(:last-child)': { mb: 1.5 } }}>
                                    {(passportConflict ?? []).map((passport) => (
                                        <Box
                                            component="li"
                                            key={`${passport.product_id}-${passport.passport_id}`}
                                            sx={{ pl: 0.5, '&::marker': { color: 'text.secondary' } }}
                                        >
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1, rowGap: 0.5 }}>
                                                <Typography variant="body2">
                                                    {passport.product_title} · Паспорт № {passport.passport_number}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: 'error.light', opacity: 0.85, fontWeight: 400 }}
                                                >
                                                    · Превышение: {formatTons(passport.exceeded_quantity)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                                <Typography color="text.secondary" sx={{ mt: 3, fontSize: '0.9rem', lineHeight: 1.45 }}>
                                    Вернуться для создания новых паспортов или сохранить с указанными превышениями?
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pt: 0, pb: 2, gap: 1 }}>
                                <Button type="button" color="inherit" onClick={() => setPassportConflict(null)}>
                                    Вернуться
                                </Button>
                                <Button type="button" variant="contained" disabled={saving} onClick={handleKeepOverrun}>
                                    Сохранить
                                </Button>
                            </DialogActions>
                        </Dialog>

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
