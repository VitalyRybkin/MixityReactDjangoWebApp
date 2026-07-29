import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';



import { Box, Container, Divider, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';



import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx';
import AddAction from '../components/ui/buttons/AddAction.jsx';
import DownloadAction from '../components/ui/buttons/DownloadAction.jsx';
import AppSnackbar from '../components/ui/feedback/AppSnackbar.jsx';
import ConfirmDialog from '../components/ui/feedback/ConfirmDialog.jsx';
import { useGetCustomers } from '../features/customers/utils/customers.queries.js';
import { useExportOrders, useGetOrders } from '../features/orders/utils/orders.queries.js';
import { useGetWarehouses } from '../features/warehouses/utils/stocks.queries.js';
import { sidebarPageSx } from '../layouts/AppSidebar.jsx';
import { localeText } from '../utils/localeDataGridText.js';



import Can from './auth/components/Can.jsx';
import { GROUPS } from './auth/permissions.js';
import CustomPagination from './components/CustomPagination.jsx';
import FilterSidebar from './components/FilterSidebar.jsx';
import { useDeleteOrderFlow } from './hooks/useDeleteOrderFlow.js';
import { useOrdersFilters } from './hooks/useOrdersFilters.js';
import { exportOrdersToExcel } from './utils/exportOrders.js';
import { formatFilteringDate } from './utils/exportOrders.js';
import { exportPowerOfAttorney } from './utils/exportPowerOfAttorney.jsx';
import { getHomeGridOrderColumns } from './utils/home_order.columns.jsx';
import { formatDate } from './utils/orders.date-filters.js';


































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
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity })

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

    const { orderToDelete, setOrderToDelete, handleConfirmDelete, isDeleting } = useDeleteOrderFlow(() =>
        showSnackbar('Заявка удалена'),
    )

    const startPeriod = formatFilteringDate(formattedFilters.dateFrom, false)
    const endPeriod = formatFilteringDate(formattedFilters.dateTo, true)
    const dateStr = formattedFilters.dateFrom === formattedFilters.dateTo ? endPeriod : `${startPeriod}-${endPeriod}`

    const customerInputValue = Array.isArray(customers)
        ? customers.find((c) => c.id === formattedFilters.customerId)?.name || '-'
        : '-'

    const warehouseInputValue = Array.isArray(warehouses)
        ? warehouses.find((w) => w.id === formattedFilters.warehouseId)?.name || '-'
        : '-'

    const selectedStatus = Array.isArray(ORDER_STATUS_OPTIONS)
        ? ORDER_STATUS_OPTIONS.find((s) => s.value === formattedFilters.status)?.label || '-'
        : '-'

    const columns = useMemo(
        () => getHomeGridOrderColumns({ onDelete: (order) => setOrderToDelete(order) }),
        [setOrderToDelete],
    )

    const handleExport = async () => {
        if (!warehouses.some((w) => w.id === formattedFilters.warehouseId)) {
            showSnackbar('Склад не выбран!', 'error')
            return
        }

        if (formattedFilters.status !== 'in_progress') {
            showSnackbar('Экспорт только для заявок в статусе "В работе"', 'error')
            return
        }

        try {
            const { data } = await fetchDownload()
            const orders = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []

            if (!orders.length) {
                showSnackbar('Нет заявок для экспорта.', 'info')
                return
            }

            await exportOrdersToExcel(orders, formattedFilters, warehouses ?? [])
            await exportPowerOfAttorney(orders)
        } catch (e) {
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

            <Box sx={{ ...sidebarPageSx.content, ...(sidebarOpen ? sidebarPageSx.contentWithSidebar : {}) }}>
                <Container maxWidth="xl" sx={{ mt: 1 }}>
                    <AppBreadcrumbs />

                    <Box sx={{ pl: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" gutterBottom fontWeight={600}>
                            Заявки
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Can group={GROUPS.LOGISTIC_MANAGER}>
                                <DownloadAction
                                    title="Экспорт заявок и довернностей"
                                    onClick={handleExport}
                                    disabled={isDownloading || loadingOrders}
                                    loading={isDownloading || loadingOrders}
                                />
                            </Can>
                            <AddAction
                                onClick={() => navigate('/orders/create', { state: { from: location.pathname } })}
                                disabled={loadingOrders}
                                loading={loadingOrders}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, p: 1 }}>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            Период:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fc9e34' }}>
                            {dateStr}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            Статус:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fc9e34' }}>
                            {selectedStatus}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            Контрагент:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fc9e34' }}>
                            {customerInputValue}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            Склад:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fc9e34' }}>
                            {warehouseInputValue}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <DataGrid
                        rows={orders ?? []}
                        columns={columns}
                        loading={loadingOrders}
                        getRowId={(row) => row.id}
                        disableRowSelectionOnClick
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                        localeText={localeText}
                        slots={{ pagination: CustomPagination }}
                        onRowClick={(params) => navigate(`/orders/${params.row.id}/edit`)}
                        sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
                    />

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
