import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Container, Divider } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import FilterSummary from '../components/FilterSummary.jsx'
import PageHeader from '../components/PageHeader.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import DownloadAction from '../components/ui/buttons/DownloadAction.jsx'
import AppSnackbar from '../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../components/ui/feedback/ConfirmDialog.jsx'
import { useGetCustomers } from '../features/customers/utils/customers.queries.js'
import OrderMobileList from '../features/orders/components/OrderMobileList.jsx'
import { useDeleteOrderFlow } from '../features/orders/hooks/useDeleteOrderFlow.js'
import { useOrdersFilters } from '../features/orders/hooks/useOrdersFilters.js'
import { useExportOrders, useGetOrders, useUploadUpd } from '../features/orders/utils/orders.queries.js'
import { useGetWarehouses } from '../features/warehouses/utils/stocks.queries.js'
import { useFileUpload } from '../hooks/useUploadFile.js'
import { sidebarPageSx } from '../layouts/AppSidebar.jsx'
import { localeText } from '../utils/localeDataGridText.js'

import { getHomeContentSx, homeSx as sx } from './Home.styles.js'
import Can from './auth/components/Can.jsx'
import { useAuth } from './auth/context/AuthContext.jsx'
import { PERMISSIONS } from './auth/permissions.js'
import CustomPagination from './components/CustomPagination.jsx'
import FilterSidebar from './components/FilterSidebar.jsx'
import { exportOrdersToExcel, formatFilteringDate } from './utils/exportOrders.js'
import { exportPowerOfAttorney } from './utils/exportPowerOfAttorney.jsx'
import { getHomeGridOrderColumns } from './utils/home_order.columns.jsx'
import { formatDate } from './utils/orders.date-filters.js'

const ORDER_STATUS_OPTIONS = [
    { value: 'draft', label: 'Черновик' },
    { value: 'created', label: 'Создана' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Завершена' },
]

const STORAGE_KEY = 'orders_filters_cache'

const today = formatDate(new Date())

const initialDefaults = {
    dateFrom: today,
    dateTo: today,
    status: '',
    customerId: '',
    warehouseId: '',
    selectedPreset: 'today',
}

const Home = () => {
    const { hasPermission } = useAuth()

    const canChangeOrders = hasPermission(PERMISSIONS.orders.change)
    const canDeleteOrders = hasPermission(PERMISSIONS.orders.delete)
    const canManageOrderUpd = hasPermission(PERMISSIONS.orders.manageUpd)
    const navigate = useNavigate()
    const location = useLocation()

    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    })

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity,
        })
    }

    const {
        formattedFilters,
        draftFilters,
        setDraftFilters,
        selectedPreset,
        applyFilters,
        handlePresetClick,
        handleDraftFilterChange,
    } = useOrdersFilters(STORAGE_KEY, initialDefaults)

    const { data: orders, isPending: loadingOrders, isError: ordersError } = useGetOrders(formattedFilters)
    const { data: customers } = useGetCustomers()
    const { data: warehouses } = useGetWarehouses()
    const { refetch: fetchDownload, isFetching: isDownloading } = useExportOrders(formattedFilters)
    const uploadUpd = useUploadUpd()
    const { orderToDelete, setOrderToDelete, handleConfirmDelete, isDeleting } = useDeleteOrderFlow(() =>
        showSnackbar('Заявка удалена'),
    )
    const startPeriod = formatFilteringDate(formattedFilters.dateFrom, false)
    const endPeriod = formatFilteringDate(formattedFilters.dateTo, true)

    const dateStr = formattedFilters.dateFrom === formattedFilters.dateTo ? endPeriod : `${startPeriod}-${endPeriod}`

    const customerInputValue = Array.isArray(customers)
        ? customers.find((customer) => customer.id === formattedFilters.customerId)?.name || '-'
        : '-'

    const warehouseInputValue = Array.isArray(warehouses)
        ? warehouses.find((warehouse) => warehouse.id === formattedFilters.warehouseId)?.name || '-'
        : '-'

    const selectedStatus = ORDER_STATUS_OPTIONS.find((status) => status.value === formattedFilters.status)?.label || '-'

    const handleUploadUpd = useFileUpload(uploadUpd, showSnackbar, {
        successMessage: 'УПД успешно загружен.',
        deleteSuccessMessage: 'УПД успешно удалён.',
        errorMessage: 'Не удалось изменить УПД.',
    })


    const columns = useMemo(
        () =>
            getHomeGridOrderColumns({
                onDelete: setOrderToDelete,
                onUploadUpd: handleUploadUpd,
                canDelete: canDeleteOrders,
                canManageUpd: canManageOrderUpd,
            }),
        [setOrderToDelete, handleUploadUpd, canDeleteOrders, canManageOrderUpd],
    )

    const handleExport = async () => {
        const warehouseList = warehouses ?? []

        if (!warehouseList.some((warehouse) => warehouse.id === formattedFilters.warehouseId)) {
            showSnackbar('Склад не выбран!', 'error')
            return
        }

        if (formattedFilters.status !== 'in_progress') {
            showSnackbar('Экспорт только для заявок в статусе "В работе"', 'error')
            return
        }

        try {
            const { data } = await fetchDownload()

            const exportOrders = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []

            if (!exportOrders.length) {
                showSnackbar('Нет заявок для экспорта.', 'info')
                return
            }

            await exportOrdersToExcel(exportOrders, formattedFilters, warehouseList)
            await exportPowerOfAttorney(exportOrders)
        } catch {
            showSnackbar('Ошибка при экспорте.', 'error')
        }
    }

    const handleOpenOrder = (id) => {
        navigate(canChangeOrders ? `/orders/${id}/edit` : `/orders/${id}`)
    }

    return (
        <Box sx={sidebarPageSx.page}>
            <FilterSidebar
                open={sidebarOpen}
                setOpen={setSidebarOpen}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                onApply={applyFilters}
                onPresetClick={handlePresetClick}
                selectedPreset={selectedPreset}
                handleDraftFilterChange={handleDraftFilterChange}
                customers={customers ?? []}
                warehouses={warehouses ?? []}
                statusOptions={ORDER_STATUS_OPTIONS}
            />

            <Box sx={getHomeContentSx(sidebarOpen)}>
                <Container maxWidth="xl" sx={sx.container}>
                    <Box sx={sx.breadcrumbs}>
                        <AppBreadcrumbs />
                    </Box>

                    <PageHeader
                        title="Заявки"
                        actions={
                            <>
                                <Can permission={PERMISSIONS.orders.export}>
                                    <Box sx={sx.exportAction}>
                                        <DownloadAction
                                            title="Экспорт заявок и доверенностей"
                                            onClick={handleExport}
                                            disabled={isDownloading || loadingOrders || uploadUpd.isPending}
                                            loading={isDownloading || loadingOrders}
                                        />
                                    </Box>
                                </Can>

                                <Can permission={PERMISSIONS.orders.add}>
                                    <AddAction
                                        onClick={() =>
                                            navigate('/orders/create', {
                                                state: {
                                                    from: location.pathname,
                                                },
                                            })
                                        }
                                        disabled={loadingOrders || uploadUpd.isPending}
                                        loading={loadingOrders}
                                    />
                                </Can>
                            </>
                        }
                    />

                    <Divider />

                    <FilterSummary
                        dateStr={dateStr}
                        items={[
                            {
                                key: 'status',
                                label: 'Статус',
                                value: selectedStatus,
                            },
                            {
                                key: 'customer',
                                label: 'Контрагент',
                                value: customerInputValue,
                            },
                            {
                                key: 'warehouse',
                                label: 'Склад',
                                value: warehouseInputValue,
                            },
                        ]}
                    />

                    <Divider sx={sx.divider} />

                    <OrderMobileList
                        orders={orders ?? []}
                        loading={loadingOrders}
                        onOpen={handleOpenOrder}
                        onDelete={setOrderToDelete}
                        onUploadUpd={handleUploadUpd}
                        canDelete={canDeleteOrders}
                        canManageUpd={canManageOrderUpd}
                    />

                    <Box sx={sx.desktopGrid}>
                        <DataGrid
                            rows={orders ?? []}
                            columns={columns}
                            loading={loadingOrders}
                            getRowId={(row) => row.id}
                            disableRowSelectionOnClick
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 10,
                                        page: 0,
                                    },
                                },
                            }}
                            localeText={{
                                ...localeText,
                                noRowsLabel: ordersError ? 'Не удалось загрузить заявки.' : localeText.noRowsLabel,
                            }}
                            slots={{
                                pagination: CustomPagination,
                            }}
                            onRowClick={(params) => handleOpenOrder(params.row.id)}
                            sx={sx.dataGrid}
                        />
                    </Box>

                    <ConfirmDialog
                        open={Boolean(orderToDelete)}
                        title="Удалить заявку?"
                        text={`Заявка №${orderToDelete?.id} будет удалена без возможности восстановления.`}
                        confirmText={isDeleting ? 'Удаление...' : 'Удалить'}
                        cancelText="Отмена"
                        onClose={() => !isDeleting && setOrderToDelete(null)}
                        onConfirm={handleConfirmDelete}
                        loading={isDeleting}
                    />

                    <AppSnackbar
                        open={snackbar.open}
                        message={snackbar.message}
                        severity={snackbar.severity}
                        onClose={() =>
                            setSnackbar((prev) => ({
                                ...prev,
                                open: false,
                            }))
                        }
                    />
                </Container>
            </Box>
        </Box>
    )
}

export default Home
