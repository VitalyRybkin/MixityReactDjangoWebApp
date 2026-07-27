import React from 'react'
import { useLocation } from 'react-router-dom'

import {Box, Checkbox, Divider, FormControlLabel, Typography} from '@mui/material'

import AppSelectField from '../../AppSelectField.jsx'
import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import { useOrdersFilters } from '../../pages/hooks/useOrdersFilters.js'
import { formatDate } from '../../pages/utils/orders.date-filters.js'
import { useGetCustomers } from '../customers/utils/customers.queries.js'
import { useGetWarehouses } from '../warehouses/utils/stocks.queries.js'
import DateRangeFields from "../../components/DateRangeFields.jsx";
import {useExportOrders, useGetOrders} from "./utils/orders.queries.js";

const STORAGE_KEY = 'searching_orders_cache'

const today = formatDate(new Date())

const initialDefaults = {
    dateFrom: today,
    dateTo: today,
    customerId: '',
    warehouseId: '',
    samples: false,
}

export default function OrderFilteringPage() {
    const location = useLocation()
    const entity = location.state?.entity

    const { data: customers = [] } = useGetCustomers()
    const { data: warehouses = [] } = useGetWarehouses()

    const {
        formattedFilters,
        draftFilters,
        applyFilters,
        handleDraftFilterChange,
    } = useOrdersFilters(
        STORAGE_KEY,
        initialDefaults,
        ['samples']
    )

    const { data: orders, isPending: loadingOrders } = useGetOrders(formattedFilters)
    const { refetch: fetchDownload, isFetching: isDownloading } = useExportOrders(formattedFilters)

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

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 3,
                    pt: 2,
                    alignItems: 'start',
                }}
            >
                <DateRangeFields
                    filters={draftFilters}
                    onChange={handleDraftFilterChange}
                    fromId="orders-date-from"
                    toId="orders-date-to"
                />

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    <AppSelectField
                        id="orders-customer"
                        label="Контрагент"
                        value={draftFilters.customerId}
                        options={customers}
                        onChange={(value) =>
                            handleDraftFilterChange('customerId', value)
                        }
                        fullWidth
                    />

                    <AppSelectField
                        id="orders-warehouse"
                        label="Склад"
                        value={draftFilters.warehouseId}
                        options={warehouses}
                        onChange={(value) =>
                            handleDraftFilterChange('warehouseId', value)
                        }
                        fullWidth
                    />
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={draftFilters.samples === true}
                                onChange={(event) =>
                                    handleDraftFilterChange('samples', event.target.checked)
                                }
                            />
                        }
                        label="Образцы"
                        slotProps={{
                            typography: {
                                sx: {
                                    fontSize: '0.9rem',
                                    color: 'text.secondary',
                                },
                            },
                        }}
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
