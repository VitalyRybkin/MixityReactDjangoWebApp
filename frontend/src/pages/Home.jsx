import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Container, Divider, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import DownloadAction from '../components/ui/buttons/DownloadAction.jsx'
import AppSnackbar from '../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../components/ui/feedback/ConfirmDialog.jsx'
import { useGetCustomers } from '../features/customers/utils/customers.queries.js'
import { getOrdersColumns, localeText } from '../features/orders/utils/order.columns.jsx'
import {useExportOrders, useGetOrders} from '../features/orders/utils/orders.queries.js'
import { useGetWarehouses } from '../features/warehouses/utils/stocks.queries.js'
import { sidebarPageSx } from '../layouts/AppSidebar.jsx'

import CustomPagination from './components/CustomPagination.jsx'
import FilterSidebar from './components/FilterSidebar.jsx'
import { useOrdersFilters } from './hooks/useOrdersFilters.js'
import { useDeleteOrderFlow } from './hooks/useDeleteOrderFlow.js'
import { exportOrdersToExcel } from './utils/exportOrders.js'

const ORDER_STATUS_OPTIONS = [
    { value: 'draft',       label: 'Черновик' },
    { value: 'created',     label: 'Создана'  },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done',        label: 'Завершена' },
]

const Home = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity })

    const {
        formattedFilters,
        draftFilters,
        setDraftFilters,
        selectedPreset,
        applyFilters,
        handlePresetClick,
        handleDraftFilterChange,
    } = useOrdersFilters()

    const { data: orders,     isPending: loadingOrders    } = useGetOrders(formattedFilters)
    const { data: customers} = useGetCustomers()
    const { data: warehouses} = useGetWarehouses()
    const { refetch: fetchDownload, isFetching: isDownloading } = useExportOrders(formattedFilters)

    const { orderToDelete, setOrderToDelete, handleConfirmDelete, isDeleting } =
        useDeleteOrderFlow(() => showSnackbar('Заявка удалена'))

    const columns = useMemo(
        () => getOrdersColumns({ onDelete: (order) => setOrderToDelete(order) }),
        [],
    )

    const handleExport = async () => {
        try {
            const { data } = await fetchDownload()
            await exportOrdersToExcel(data, formattedFilters, warehouses ?? [])
        } catch (e) {
            if (e.message === 'NO_DATA') {
                showSnackbar('Нет заявок для экспорта.', 'info')
            } else {
                showSnackbar('Ошибка при экспорте.', 'error')
            }
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
                onDraftFilterChange={handleDraftFilterChange}
                customers={customers ?? []}
                warehouses={warehouses ?? []}
                statusOptions={ORDER_STATUS_OPTIONS}
            />

            <Box sx={{ ...sidebarPageSx.content, ...(sidebarOpen ? sidebarPageSx.contentWithSidebar : {}) }}>
                <Container maxWidth="xl" sx={{ mt: 1 }}>
                    <AppBreadcrumbs />

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" gutterBottom fontWeight={600}>
                            Заявки
                        </Typography>
                        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                            <DownloadAction
                                title="Сохранить заявки"
                                onClick={handleExport}
                                disabled={isDownloading}
                                loading={isDownloading}
                            />
                            <AddAction
                                onClick={() => navigate('/orders/create', { state: { from: location.pathname } })}
                                disabled={loadingOrders}
                                loading={loadingOrders}
                            />
                        </Box>
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