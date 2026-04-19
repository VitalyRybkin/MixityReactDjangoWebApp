import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Container, Divider, TextField, Tooltip, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import CustomPagination from '../features/orders/CustomPagination.jsx'
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

    const today = new Date().toLocaleDateString('en-CA')

    const [preset, setPreset] = useState('today')

    const [filters, setFilters] = useState({
        dateFrom: today,
        dateTo: today,
    })

    const [draftFilters, setDraftFilters] = useState({
        dateFrom: today,
        dateTo: today,
    })

    const formatDate = (date) => date.toLocaleDateString('en-CA')

    const getPresetRange = (preset) => {
        const now = new Date()

        if (preset === 'yesterday') {
            const d = new Date(now)
            d.setDate(d.getDate() - 1)
            const value = formatDate(d)
            return { dateFrom: value, dateTo: value }
        }

        if (preset === 'today') {
            const value = formatDate(now)
            return { dateFrom: value, dateTo: value }
        }

        if (preset === 'tomorrow') {
            const d = new Date(now)
            d.setDate(d.getDate() + 1)
            const value = formatDate(d)
            return { dateFrom: value, dateTo: value }
        }

        return { dateFrom: '', dateTo: '' }
    }

    const activeFilters =
        preset !== null
            ? getPresetRange(preset)
            : {
                  dateFrom: filters.dateFrom,
                  dateTo: filters.dateTo,
              }

    const { data: orders, isPending: loadingOrders, error: loadError, refetch } = useGetOrders(activeFilters)

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
            {' '}
            <Box sx={sx.sidebar(open)}>
                {open ? (
                    <>
                        <Tooltip title="Закрыть" placement="bottom" arrow>
                            <Button variant="outlined" onClick={() => setOpen(false)} fullWidth sx={sx.closeButton}>
                                <ChevronLeftIcon />
                            </Button>
                        </Tooltip>

                        <Typography variant="h6" sx={{ mt: 3, mb: 0 }}>
                            Фильтры
                        </Typography>
                        <Divider sx={{ my: 2, mb: 0 }} />

                        <TextField
                            label="C:"
                            type="date"
                            value={draftFilters.dateFrom}
                            onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                            fullWidth
                            size="small"
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="По:"
                            type="date"
                            value={draftFilters.dateTo}
                            onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                            fullWidth
                            size="small"
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => {
                                setFilters(draftFilters)
                                setPreset(null)
                            }}
                        >
                            Применить
                        </Button>
                        <Divider sx={{ my: 2, mb: 0 }} />
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, mb: 2 }}>
                            <Button
                                variant={preset === 'yesterday' ? 'contained' : 'outlined'}
                                onClick={() => setPreset('yesterday')}
                            >
                                Вчера
                            </Button>

                            <Button
                                variant={preset === 'today' ? 'contained' : 'outlined'}
                                onClick={() => setPreset('today')}
                            >
                                Сегодня
                            </Button>

                            <Button
                                variant={preset === 'tomorrow' ? 'contained' : 'outlined'}
                                onClick={() => setPreset('tomorrow')}
                            >
                                Завтра
                            </Button>
                        </Box>
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
