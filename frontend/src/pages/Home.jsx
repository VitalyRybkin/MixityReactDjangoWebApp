import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Container, Divider, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import DownloadAction from '../components/ui/buttons/DownloadAction.jsx'
import AppSnackbar from '../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../components/ui/feedback/ConfirmDialog.jsx'
import { useGetCustomers } from '../features/customers/utils/customers.queries.js'
import OrderMobileList from '../features/orders/components/OrderMobileList.jsx'
import { useViewUpd } from '../features/orders/hooks/useViewUpd.js'
import { useExportOrders, useGetOrders, useUploadUpd } from '../features/orders/utils/orders.queries.js'
import { useGetWarehouses } from '../features/warehouses/utils/stocks.queries.js'
import { useFileUpload } from '../hooks/useUploadFile.js'
import { sidebarPageSx } from '../layouts/AppSidebar.jsx'
import { localeText } from '../utils/localeDataGridText.js'

import { getHomeContentSx, homeSx as sx } from './Home.styles.js'
import Can from './auth/components/Can.jsx'
import { GROUPS } from './auth/permissions.js'
import CustomPagination from './components/CustomPagination.jsx'
import FilterSidebar from './components/FilterSidebar.jsx'
import { useDeleteOrderFlow } from './hooks/useDeleteOrderFlow.js'
import { useOrdersFilters } from './hooks/useOrdersFilters.js'
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
    const navigate = useNavigate()
    const location = useLocation()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    })

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity })
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

    const { data: orders, isPending: loadingOrders } = useGetOrders(formattedFilters)
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

    const handleViewUpd = useViewUpd(showSnackbar)

    const columns = useMemo(
        () =>
            getHomeGridOrderColumns({
                onDelete: setOrderToDelete,
                onUploadUpd: handleUploadUpd,
                onViewUpd: handleViewUpd,
            }),
        [handleUploadUpd, handleViewUpd],
    )

    const handleExport = async () => {
        if (!warehouses.some((warehouse) => warehouse.id === formattedFilters.warehouseId)) {
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

            await exportOrdersToExcel(exportOrders, formattedFilters, warehouses ?? [])
            await exportPowerOfAttorney(exportOrders)
        } catch {
            showSnackbar('Ошибка при экспорте.', 'error')
        }
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
                    <AppBreadcrumbs />

                    <Box sx={sx.header}>
                        <Typography variant="h4" gutterBottom fontWeight={600}>
                            Заявки
                        </Typography>

                        <Box sx={sx.headerActions}>
                            <Can group={GROUPS.LOGISTIC_MANAGER}>
                                <Box sx={sx.exportAction}>
                                    <DownloadAction
                                        title="Экспорт заявок и доверенностей"
                                        onClick={handleExport}
                                        disabled={isDownloading || loadingOrders || uploadUpd.isPending}
                                        loading={isDownloading || loadingOrders}
                                    />
                                </Box>
                            </Can>

                            <AddAction
                                onClick={() =>
                                    navigate('/orders/create', {
                                        state: { from: location.pathname },
                                    })
                                }
                                disabled={loadingOrders || uploadUpd.isPending}
                                loading={loadingOrders}
                            />
                        </Box>
                    </Box>

                    <Box sx={sx.filtersSummary}>
                        <Box sx={sx.filterItem}>
                            <Typography variant="body1" sx={sx.filterLabel}>
                                Период:
                            </Typography>
                            <Typography variant="body1" sx={sx.filterValue}>
                                {dateStr}
                            </Typography>
                        </Box>

                        <Box sx={sx.filterItem}>
                            <Typography variant="body1" sx={sx.filterLabel}>
                                Статус:
                            </Typography>
                            <Typography variant="body1" sx={sx.filterValue}>
                                {selectedStatus}
                            </Typography>
                        </Box>

                        <Box sx={sx.filterItem}>
                            <Typography variant="body1" sx={sx.filterLabel}>
                                Контрагент:
                            </Typography>
                            <Typography variant="body1" sx={sx.filterValue}>
                                {customerInputValue}
                            </Typography>
                        </Box>

                        <Box sx={sx.filterItem}>
                            <Typography variant="body1" sx={sx.filterLabel}>
                                Склад:
                            </Typography>
                            <Typography variant="body1" sx={sx.filterValue}>
                                {warehouseInputValue}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={sx.divider} />

                    <OrderMobileList
                        orders={orders ?? []}
                        loading={loadingOrders}
                        onOpen={(id) => navigate(`/orders/${id}/edit`)}
                        onDelete={setOrderToDelete}
                        onUploadUpd={handleUploadUpd}
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
                            localeText={localeText}
                            slots={{ pagination: CustomPagination }}
                            onRowClick={(params) => navigate(`/orders/${params.row.id}/edit`)}
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
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    />
                </Container>
            </Box>
        </Box>
    )
}

export default Home
