import React from 'react'

import { Box, Divider, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import { useGetCustomers } from '../customers/utils/customers.queries.js'

const dateFieldProps = {
    fullWidth: true,
    size: 'small',
    margin: 'normal',
    slotProps: {
        inputLabel: { shrink: true },
    },
}

export default function OrderFilteringPage() {
    const entity = location.state?.entity

    const todayStr = new Date().toISOString().split('T')[0]
    const { data: customers } = useGetCustomers()
    console.log(customers)

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    Фильтр по заявкам
                </Typography>
            </Box>

            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextField
                    id="orders-date-from"
                    name="dateFrom"
                    label="C:"
                    type="date"
                    value={todayStr}
                    onChange={(e) => onDraftFilterChange('dateFrom', e.target.value)}
                    {...dateFieldProps}
                />

                <TextField
                    id="orders-date-to"
                    name="dateTo"
                    label="По:"
                    type="date"
                    value={todayStr}
                    onChange={(e) => onDraftFilterChange('dateTo', e.target.value)}
                    {...dateFieldProps}
                />
            </Box>
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl fullWidth size="small" margin="normal">
                    <InputLabel id="orders-customer-label">Контрагент</InputLabel>
                    <Select
                        labelId="orders-customer-label"
                        id="orders-customer"
                        value={draftFilters.customerId}
                        label="Контрагент"
                        variant="outlined"
                        // onChange={(e) => setDraftFilters((prev) => ({ ...prev, customerId: e.target.value }))}
                    >
                        <MenuItem value="">Все</MenuItem>
                        {customers?.map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Divider sx={{ mb: 3 }} />
        </Box>
    )
}
