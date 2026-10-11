import { useLocation } from 'react-router-dom'

import { Box, Divider } from '@mui/material'

import AppSelectField from '../../AppSelectField.jsx'
import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import DateRangeFields from '../../components/DateRangeFields.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import DownloadAction from '../../components/ui/buttons/DownloadAction.jsx'
import ResetAction from '../../components/ui/buttons/ResetAction.jsx'
import { useFilters } from '../../hooks/useFilters.js'
import { formatDate } from '../../pages/utils/orders.date-filters.js'
import { filteringPageSx as sx } from '../../styles/filteringPage.styles.js'
import { useGetCustomerObjects, useGetCustomers } from '../customers/utils/customers.queries.js'

const statusOptions = [
    { id: 'open', name: 'Открыта' },
    { id: 'closed', name: 'Закрыта' },
]

const locationOptions = [
    { id: 'site', name: 'На объекте' },
    { id: 'workshop', name: 'В мастерской' },
]

const today = formatDate(new Date())

const initialDefaults = {
    dateFrom: today,
    dateTo: today,
    customerId: '',
    objectId: '',
    status: '',
    location: '',
}

export default function RepairRequestListPage() {
    const location = useLocation()
    const entity = location.state?.entity

    const { data: customers = [] } = useGetCustomers()

    const { filters, draftFilters, applyFilters, resetFilters, handleDraftFilterChange } = useFilters(initialDefaults)

    const { data: customerObjects = [] } = useGetCustomerObjects(draftFilters.customerId)

    const handleCustomerChange = (value) => {
        handleDraftFilterChange('customerId', value)
        handleDraftFilterChange('objectId', '')
    }

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <PageHeader title="Ремонт" actions={<DownloadAction title="Экспорт в Excel" />} />

            <Divider />

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
                        fullWidth
                    />

                    <AppSelectField
                        id="repair-object"
                        label="Объект"
                        value={draftFilters.objectId}
                        options={customerObjects}
                        onChange={(value) => handleDraftFilterChange('objectId', value)}
                        disabled={!draftFilters.customerId}
                        fullWidth
                    />
                </Box>

                <Box sx={sx.filterColumn}>
                    <AppSelectField
                        id="repair-status"
                        label="Статус"
                        value={draftFilters.status}
                        options={statusOptions}
                        onChange={(value) => handleDraftFilterChange('status', value)}
                        fullWidth
                    />

                    <AppSelectField
                        id="repair-location"
                        label="Место выполнения"
                        value={draftFilters.location}
                        options={locationOptions}
                        onChange={(value) => handleDraftFilterChange('location', value)}
                        fullWidth
                    />
                </Box>
            </Box>

            <Box sx={sx.actions}>
                <ApplyAction onClick={applyFilters} sx={sx.applyButton} />
                <ResetAction onClick={resetFilters} />
            </Box>

            <Divider sx={sx.tableDivider} />
        </Box>
    )
}
