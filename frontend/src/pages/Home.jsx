import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Container, Divider, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import CustomPagination from '../features/orders/CustomPagination.jsx'
import OrdersFiltersSidebar, { ordersSidebarSx } from '../features/orders/OrdersFiltersSidebar.jsx'
import { getOrdersColumns } from '../features/orders/orders.columns.js'
import { formatDate, getPresetRange } from '../features/orders/orders.date-filters.js'
import { useGetOrders } from '../features/orders/orders.queries.js'

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

const Home = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const today = formatDate(new Date())

    const [open, setOpen] = useState(false)
    const [preset, setPreset] = useState('today')
    const [filters, setFilters] = useState({
        dateFrom: today,
        dateTo: today,
        status: '',
        customerId: '',
    })
    const [draftFilters, setDraftFilters] = useState({
        dateFrom: today,
        dateTo: today,
        status: '',
        customerId: '',
    })

    const activeFilters =
        preset !== null
            ? {
                  ...getPresetRange(preset),
                  status: filters.status,
                  customerId: filters.customerId,
              }
            : filters

    const { data: orders, isPending: loadingOrders, error: loadError, refetch } = useGetOrders(activeFilters)

    const rows = orders ?? []
    const columns = useMemo(() => getOrdersColumns(), [])

    const customers = Array.from(
        new Map(rows.filter((row) => row.customer).map((row) => [row.customer.id, row.customer])).values(),
    )

    const handleApplyFilters = () => {
        setFilters(draftFilters)
        setPreset(null)
    }

    return (
        <Box sx={sx.page}>
            <OrdersFiltersSidebar
                open={open}
                setOpen={setOpen}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                preset={preset}
                setPreset={setPreset}
                onApply={handleApplyFilters}
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
                        localeText={{
                            noRowsLabel: 'На выбранный период доставки заказов нет.',
                        }}
                        slots={{
                            pagination: CustomPagination,
                        }}
                        onRowClick={(params) => navigate(`/orders/${params.row.id}`)}
                        sx={{
                            '& .MuiDataGrid-row': {
                                cursor: 'pointer',
                            },
                        }}
                    />
                </Container>
            </Box>
        </Box>
    )
}

export default Home
