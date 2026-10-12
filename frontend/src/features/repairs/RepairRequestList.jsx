import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Divider } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import AppSelectField from '../../components/AppSelectField.jsx'
import DateRangeFields from '../../components/DateRangeFields.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import DownloadAction from '../../components/ui/buttons/DownloadAction.jsx'
import ResetAction from '../../components/ui/buttons/ResetAction.jsx'
import { useFilters } from '../../hooks/useFilters.js'
import { formatDate } from '../../pages/utils/orders.date-filters.js'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'
import { filteringPageSx as sx } from '../../styles/filteringPage.styles.js'
import { useGetCustomerObjects, useGetCustomers } from '../customers/utils/customers.queries.js'

import { useGetRepairCompanies, useGetRepairRequests } from './utils/repair.queries.js'
import { locationOptions, statusOptions } from './utils/request.form.constants.js'

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

export default function RepairRequestListPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const entity = location.state?.entity

    const { data: customers = [] } = useGetCustomers()
    const { data: repairCompanies = [] } = useGetRepairCompanies()

    const { filters, draftFilters, applyFilters, resetFilters, handleDraftFilterChange } = useFilters(initialDefaults)

    const { data: customerObjects = [] } = useGetCustomerObjects(draftFilters.customerId)
    const { data: repairRequests = [], isLoading: loadingRepairRequests } = useGetRepairRequests(draftFilters)

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

    return (
        <Box sx={listSx.page}>
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

            <AppSelectField
                id="repair-customer"
                label="Ремонтирующая компания"
                value={draftFilters.repairCompanyId}
                options={repairCompanies}
                onChange={handleRepairCompanyChange}
                searchable
                fullWidth
                sx={{ width: '410px', mt: 1 }}
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
                    onClick={applyFilters}
                    sx={sx.applyButton}
                    disabled={loadingRepairRequests}
                    loading={loadingRepairRequests}
                />
                <ResetAction onClick={resetFilters} disabled={loadingRepairRequests} loading={loadingRepairRequests} />
            </Box>

            <Divider sx={sx.tableDivider} />
        </Box>
    )
}
