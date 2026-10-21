import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
    Box,
    Collapse,
    Divider,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import AppSelectField from '../../components/AppSelectField.jsx'
import DateRangeFields from '../../components/DateRangeFields.jsx'
import FilterSummary from '../../components/FilterSummary.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import DownloadAction from '../../components/ui/buttons/DownloadAction.jsx'
import ExpandAction from '../../components/ui/buttons/ExpandAction.jsx'
import ResetAction from '../../components/ui/buttons/ResetAction.jsx'
import { useFilters } from '../../hooks/useFilters.js'
import { formatFilteringDate } from '../../pages/utils/exportOrders.js'
import { formatDate } from '../../pages/utils/orders.date-filters.js'
import { filteriSummarySx as sx } from '../../styles/filterSummary.styles.js'
import { useGetCustomerObjects, useGetCustomers } from '../customers/utils/customers.queries.js'

import { useGetRepairCompanies, useGetRepairRequests } from './utils/repair.queries.js'
import { locationOptions, statusOptions } from './utils/request.form.constants.js'

const PAGE_SIZE = 10
const STORAGE_KEY = 'repair_requests_filters'

const today = formatDate(new Date())

const initialDefaults = {
    dateFrom: today,
    dateTo: today,
    customerId: '',
    objectId: '',
    status: '',
    location: '',
    repairCompanyId: '',
}

const headerCellSx = {
    fontWeight: 700,
    borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
}

export default function RepairRequestListPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const entity = location.state?.entity
    const [page, setPage] = useState(1)
    const [filtersOpen, setFiltersOpen] = useState(false)

    const { data: customers = [] } = useGetCustomers()
    const { data: repairCompanies = [] } = useGetRepairCompanies()

    const { filters, draftFilters, applyFilters, resetFilters, handleDraftFilterChange } = useFilters(
        initialDefaults,
        STORAGE_KEY,
    )

    const { data: customerObjects = [] } = useGetCustomerObjects(draftFilters.customerId)
    const { data: repairRequests, isLoading: loadingRepairRequests } = useGetRepairRequests({
        ...filters,
        page,
    })

    const rows = repairRequests?.results ?? []
    const totalCount = repairRequests?.count ?? 0

    const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

    const handleCustomerChange = (value) => {
        handleDraftFilterChange('customerId', value)
        handleDraftFilterChange('objectId', '')
    }

    const toSelectOptions = (options) =>
        Object.entries(options).map(([id, name]) => ({
            id,
            name,
        }))

    const handleRepairCompanyChange = (value) => {
        handleDraftFilterChange('repairCompanyId', value)
    }

    const handleApplyFilters = () => {
        setPage(1)
        applyFilters()
    }

    const handleResetFilters = () => {
        setPage(1)
        resetFilters()
    }
    const startPeriod = formatFilteringDate(filters.dateFrom, false)
    const endPeriod = formatFilteringDate(filters.dateTo, true)

    const dateStr = filters.dateFrom === filters.dateTo ? endPeriod : `${startPeriod}-${endPeriod}`

    const customerInputValue = Array.isArray(customers)
        ? customers.find((customer) => customer.id === filters.customerId)?.name || '-'
        : '-'

    const objectInputValue = Array.isArray(customerObjects)
        ? customerObjects.find((object) => object.id === filters.objectId)?.name || '-'
        : '-'
    const locationInputValue = locationOptions[filters.location] || '-'
    const statusInputValue = statusOptions[filters.status] || '-'

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <PageHeader
                title="Ремонт"
                actions={
                    <>
                        <DownloadAction
                            title="Экспорт в Excel"
                            disabled={loadingRepairRequests}
                            loading={loadingRepairRequests}
                        />
                        <AddAction
                            onClick={() =>
                                navigate('/repair/requests/create', {
                                    state: {
                                        from: location.pathname,
                                    },
                                })
                            }
                            disabled={loadingRepairRequests}
                            loading={loadingRepairRequests}
                        />
                    </>
                }
            />

            <Divider />
            <FilterSummary
                dateStr={dateStr}
                leading={<ExpandAction open={filtersOpen} onClick={() => setFiltersOpen((prev) => !prev)} />}
                trailing={
                    <ResetAction
                        onClick={handleResetFilters}
                        disabled={loadingRepairRequests}
                        loading={loadingRepairRequests}
                    />
                }
                items={[
                    {
                        key: 'customer',
                        label: 'Контрагент',
                        value: customerInputValue,
                    },
                    {
                        key: 'object',
                        label: 'Объект',
                        value: objectInputValue,
                    },
                    {
                        key: 'status',
                        label: 'Статус',
                        value: statusInputValue,
                    },
                    {
                        key: 'location',
                        label: 'Место выполнения',
                        value: locationInputValue,
                    },
                ]}
            />

            <Collapse in={filtersOpen}>
                <AppSelectField
                    id="repair-customer"
                    label="Ремонтирующая компания"
                    value={draftFilters.repairCompanyId}
                    options={repairCompanies}
                    onChange={handleRepairCompanyChange}
                    searchable
                    fullWidth
                    sx={{ width: '420px', mt: 1 }}
                />

                <Box sx={sx.filters}>
                    <DateRangeFields
                        filters={draftFilters}
                        onChange={handleDraftFilterChange}
                        fromId="repair-date-from"
                        toId="repair-date-to"
                    />

                    <Box sx={sx.filterColumn}>
                        <AppSelectField
                            id="repair-customer"
                            label="Контрагент"
                            value={draftFilters.customerId}
                            options={customers}
                            onChange={handleCustomerChange}
                            searchable
                            fullWidth
                        />

                        <AppSelectField
                            id="repair-object"
                            label="Объект"
                            value={draftFilters.objectId}
                            options={customerObjects}
                            onChange={(value) => handleDraftFilterChange('objectId', value)}
                            disabled={!draftFilters.customerId}
                            searchable
                            fullWidth
                        />
                    </Box>

                    <Box sx={sx.filterColumn}>
                        <AppSelectField
                            id="repair-status"
                            label="Статус"
                            value={draftFilters.status}
                            options={toSelectOptions(statusOptions)}
                            onChange={(value) => handleDraftFilterChange('status', value)}
                            fullWidth
                        />

                        <AppSelectField
                            id="repair-location"
                            label="Место выполнения"
                            value={draftFilters.location}
                            options={toSelectOptions(locationOptions)}
                            onChange={(value) => handleDraftFilterChange('location', value)}
                            fullWidth
                        />
                    </Box>
                </Box>

                <Box sx={sx.actions}>
                    <ApplyAction
                        onClick={handleApplyFilters}
                        sx={sx.applyButton}
                        disabled={loadingRepairRequests}
                        loading={loadingRepairRequests}
                    />
                </Box>
            </Collapse>

            <Divider sx={sx.tableDivider} />

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headerCellSx}>№</TableCell>
                            <TableCell sx={headerCellSx}>Дата</TableCell>
                            <TableCell sx={headerCellSx}>Контрагент</TableCell>
                            <TableCell sx={headerCellSx}>Объект</TableCell>
                            <TableCell sx={headerCellSx}>Статус</TableCell>
                            <TableCell sx={headerCellSx}>Место выполнения</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map((request) => (
                            <TableRow
                                key={request.id}
                                hover
                                onClick={() => navigate(`/repair/requests/${request.id}`)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{request.id}</TableCell>

                                <TableCell>{request.request_date}</TableCell>

                                <TableCell>{request.construction_object?.customer_name ?? '—'}</TableCell>

                                <TableCell>{request.construction_object?.name ?? '—'}</TableCell>

                                <TableCell>{statusOptions[request.status] ?? request.status}</TableCell>

                                <TableCell>{locationOptions[request.location] ?? request.location}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 2,
                }}
            >
                <Pagination
                    page={page}
                    count={pageCount}
                    onChange={(_, value) => setPage(value)}
                    disabled={loadingRepairRequests}
                />
            </Box>
        </Box>
    )
}
