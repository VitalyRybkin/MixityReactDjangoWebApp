import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Container, Divider, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import dayjs from 'dayjs'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import AppSnackbar from '../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../components/ui/feedback/ConfirmDialog.jsx'
import { useGetCustomers } from '../features/customers/customers.queries.js'
import { getOrdersColumns, localeText } from '../features/orders/order.columns.jsx'
import { useDeleteOrder, useGetOrders } from '../features/orders/orders.queries.js'

import CustomPagination from './components/CustomPagination.jsx'
import FilterSidebar from './components/FilterSidebar.jsx'
import { formatDate, getPresetRange } from './components/orders.date-filters.js'

const SIDEBAR_WIDTH = 300
const TOPBAR_HEIGHT = 64
const COLLAPSED_WIDTH = 48

const ORDER_STATUS_OPTIONS = [
    { value: 'draft', label: 'Черновик' },
    { value: 'created', label: 'Создана' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Завершена' },
]

const sx = {
    page: {
        minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
    },
    content: {
        transition: 'margin-left 0.3s ease',
        ml: `${COLLAPSED_WIDTH}px`,
        pt: 4,
    },
    contentWithSidebar: {
        ml: `${SIDEBAR_WIDTH}px`,
    },
}

const STORAGE_KEY = 'orders_filters_cache'

const saveFiltersToStorage = (filters) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

const loadFiltersFromStorage = (defaults) => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaults

    try {
        const parsed = JSON.parse(saved)
        return {
            ...defaults,
            ...parsed,
            dateFrom: parsed.dateFrom || defaults.dateFrom,
            dateTo: parsed.dateTo || defaults.dateTo,
        }
    } catch (e) {
        console.error('Error parsing filters', e)
        return defaults
    }
}

const Home = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const today = formatDate(new Date())

    const [open, setOpen] = useState(false)

    const initialDefaults = {
        dateFrom: today,
        dateTo: today,
        status: '',
        customerId: '',
        selectedPreset: 'today',
    }

    const savedData = useMemo(() => loadFiltersFromStorage(initialDefaults), [])

    const [selectedPreset, setSelectedPreset] = useState(savedData.selectedPreset)
    const [filters, setFilters] = useState(savedData)
    const [draftFilters, setDraftFilters] = useState(savedData)

    const formattedFilters = {
        ...filters,
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || '',
    }

    const { data: orders, isPending: loadingOrders } = useGetOrders(formattedFilters)
    const { data: customers, isPending: loadingCustomers } = useGetCustomers()

    const rows = orders ?? []
    // const columns = useMemo(() => getOrdersColumns(), [])

    const handleApplyFilters = () => {
        setFilters(draftFilters)
        saveFiltersToStorage(draftFilters)
        // setOpen(false)
    }

    const handlePresetClick = (preset) => {
        const range = getPresetRange(preset)
        setSelectedPreset(preset)
        setDraftFilters((prev) => ({
            ...prev,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
            selectedPreset: preset, // Добавляем сюда!
        }))
    }

    const handleDraftFilterChange = (field, value) => {
        const isDateField = field === 'dateFrom' || field === 'dateTo'

        setDraftFilters((prev) => ({
            ...prev,
            [field]: isDateField && value ? dayjs(value).format('YYYY-MM-DD') : value,
            ...(isDateField ? { selectedPreset: null } : {}),
        }))

        if (isDateField) {
            setSelectedPreset(null)
        }
    }

    const [orderToDelete, setOrderToDelete] = useState(null)

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    })

    const deleteOrder = useDeleteOrder()

    const columns = useMemo(
        () =>
            getOrdersColumns({
                onDelete: (order) => setOrderToDelete(order),
            }),
        [],
    )

    const handleConfirmDelete = () => {
        if (!orderToDelete) return

        deleteOrder.mutate(orderToDelete.id, {
            onSuccess: () => {
                setOrderToDelete(null)
                setSnackbar({
                    open: true,
                    message: 'Заявка удалена',
                    severity: 'success',
                })
            },
        })
    }

    return (
        <Box sx={sx.page}>
            <FilterSidebar
                open={open}
                setOpen={setOpen}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                onApply={handleApplyFilters}
                onPresetClick={handlePresetClick}
                selectedPreset={selectedPreset}
                onDraftFilterChange={handleDraftFilterChange}
                customers={customers}
                statusOptions={ORDER_STATUS_OPTIONS}
            />

            <Box sx={{ ...sx.content, ...(open ? sx.contentWithSidebar : {}) }}>
                <Container maxWidth="xl" sx={{ mt: 1 }}>
                    <AppBreadcrumbs />

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" gutterBottom fontWeight={600}>
                            Заявки
                        </Typography>

                        <AddAction onClick={() => navigate('/orders/create', { state: { from: location.pathname } })} />
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <DataGrid
                        rows={rows}
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
                        slots={{
                            pagination: CustomPagination,
                        }}
                        onRowClick={(params) => navigate(`/orders/${params.row.id}/edit`)}
                        sx={{
                            '& .MuiDataGrid-row': {
                                cursor: 'pointer',
                            },
                        }}
                    />
                    <ConfirmDialog
                        open={Boolean(orderToDelete)}
                        title="Удалить заявку?"
                        text={`Заявка №${orderToDelete?.id} будет удалена без возможности восстановления.`}
                        confirmText={deleteOrder.isPending ? 'Удаление...' : 'Удалить'}
                        cancelText="Отмена"
                        onClose={() => !deleteOrder.isPending && setOrderToDelete(null)}
                        onConfirm={handleConfirmDelete}
                        loading={deleteOrder.isPending}
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
