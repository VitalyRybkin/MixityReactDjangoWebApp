import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Container, Divider, Tooltip, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import { useGetOrders } from '../features/orders/orders.queries.js'

const SIDEBAR_WIDTH = 280
const TOPBAR_HEIGHT = 64
const COLLAPSED_WIDTH = 48

const sx = {
    page: {
        minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
    },
    sidebar: (open) => ({
        position: 'fixed',
        top: `${TOPBAR_HEIGHT}px`,
        left: 0,
        width: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
        height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        p: open ? 2 : 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
    }),
    collapsedButtonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        pt: 2,
    },
    collapsedButton: {
        minWidth: 0,
        width: 24,
        height: 40,
        p: 0,
        borderRadius: 1,
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
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    const { data: orders, isPending: loadingOrders, error: loadError, refetch } = useGetOrders()

    const rows = orders ?? []

    const columns = [
        { field: 'id', headerName: 'Заявка №', flex: 0.7 },
        {
            field: 'created_at',
            headerName: 'Дата заявки',
            flex: 1.2,
            valueGetter: (_, row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—'),
        },
        {
            field: 'client_name',
            headerName: 'Клиент',
            flex: 1.2,
            valueGetter: (_, row) => row.client?.name ?? '—',
        },
        {
            field: 'customer_name',
            headerName: 'Контрагент',
            flex: 1.2,
            valueGetter: (_, row) => row.customer?.name ?? '—',
        },
        { field: 'delivery_date', headerName: 'Дата доставки', flex: 1 },
        {
            field: 'delivery_window',
            headerName: 'Время доставки',
            flex: 1,
            valueGetter: (_, row) => `${row.delivery_from ?? '—'} – ${row.delivery_to ?? '—'}`,
        },
        { field: 'status', headerName: 'Статус', flex: 1 },
    ]

    return (
        <Box sx={sx.page}>
            <Box sx={sx.sidebar(open)}>
                {open ? (
                    <>
                        <Tooltip title="Закрыть" placement="bottom" arrow>
                            <Button variant="outlined" onClick={() => setOpen(false)} fullWidth sx={sx.closeButton}>
                                <ChevronLeftIcon />
                            </Button>
                        </Tooltip>

                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Filters
                        </Typography>
                    </>
                ) : (
                    <Box sx={sx.collapsedButtonWrapper}>
                        <Tooltip title="Открыть" placement="right" arrow>
                            <Button variant="outlined" onClick={() => setOpen(true)} sx={sx.collapsedButton}>
                                <ChevronRightIcon fontSize="small" />
                            </Button>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            <Box sx={{ ...sx.content, ...(open ? sx.contentWithSidebar : {}) }}>
                <Container maxWidth="xl" sx={{ mt: 1 }}>
                    <AppBreadcrumbs />
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
