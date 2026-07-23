import React from 'react'
import { useLocation } from 'react-router-dom'

import { Box, Divider, TextField, Typography } from '@mui/material'

import AppSelectField from '../../AppSelectField.jsx'
import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import { useOrdersFilters } from '../../pages/hooks/useOrdersFilters.js'
import { formatDate } from '../../pages/utils/orders.date-filters.js'
import { useGetCustomers } from '../customers/utils/customers.queries.js'
import { useGetWarehouses } from '../warehouses/utils/stocks.queries.js'

const dateFieldProps = {
    fullWidth: true,
    size: 'small',
    margin: 'normal',
    slotProps: {
        inputLabel: { shrink: true },
    },
}

const STORAGE_KEY = 'searching_orders_cache'

const today = formatDate(new Date())

const initialDefaults = {
    dateFrom: today,
    dateTo: today,
    status: '',
    customerId: '',
    warehouseId: '',
    selectedPreset: 'today',
}

export default function OrderFilteringPage() {
    const location = useLocation()
    const entity = location.state?.entity

    const { data: customers = [] } = useGetCustomers()
    const { data: warehouses = [] } = useGetWarehouses()

    const { draftFilters, applyFilters, handleDraftFilterChange } = useOrdersFilters(STORAGE_KEY, initialDefaults)

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    Фильтр по заявкам
                </Typography>
            </Box>

            <Divider />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        id="orders-date-from"
                        name="dateFrom"
                        label="C:"
                        type="date"
                        value={draftFilters.dateFrom}
                        onChange={(e) => handleDraftFilterChange('dateFrom', e.target.value)}
                        {...dateFieldProps}
                        fullWidth
                    />
                    <TextField
                        id="orders-date-to"
                        name="dateTo"
                        label="По:"
                        type="date"
                        value={draftFilters.dateTo}
                        onChange={(e) => handleDraftFilterChange('dateTo', e.target.value)}
                        {...dateFieldProps}
                        fullWidth
                    />
                </Box>
                <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <AppSelectField
                        id="orders-customer"
                        label="Контрагент"
                        value={draftFilters.customerId}
                        options={customers}
                        onChange={(value) => handleDraftFilterChange('customerId', value)}
                        fullWidth
                    />
                    <AppSelectField
                        id="orders-warehouse"
                        label="Склад"
                        value={draftFilters.warehouseId}
                        options={warehouses}
                        onChange={(value) => handleDraftFilterChange('warehouseId', value)}
                        fullWidth
                    />
                </Box>
            </Box>

            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <ApplyAction onClick={applyFilters} sx={{ width: '200px' }} />
            </Box>

            <Divider sx={{ mb: 3 }} />
        </Box>
    )
}
