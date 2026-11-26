import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
    Box,
    Checkbox,
    Collapse,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import AppSelectField from '../../components/AppSelectField.jsx'
import DateRangeFields from '../../components/DateRangeFields.jsx'
import FilterSummary from '../../components/FilterSummary.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import DeleteAction from '../../components/ui/buttons/DeleteAction.jsx'
import ExpandAction from '../../components/ui/buttons/ExpandAction.jsx'
import ResetAction from '../../components/ui/buttons/ResetAction.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFilters } from '../../hooks/useFilters.js'
import { useAuth } from '../../pages/auth/context/useAuth.js'
import { formatFilteringDate } from '../../pages/utils/exportOrders.js'
import { filteriSummarySx as sx } from '../../styles/filterSummary.styles.js'
import { formatDateYear } from '../../utils/DateTimeFormatting.js'
import { firstError } from '../../utils/apiError.js'
import { useGetCustomerObjects, useGetCustomers } from '../customers/utils/customers.queries.js'

import {
    DIRECTIONS,
    INITIAL_FILTERS,
    PROVIDERS,
    STATUSES,
} from './utils/additionalServices.constants.js'
import {
    useAdditionalServices,
    useDeleteAdditionalService,
} from './utils/additionalServices.queries.js'

const PAGE_SIZE = 10
const STORAGE_KEY = 'additional_services_filters'

const headerCellSx = {
    fontWeight: 700,
    borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
}

const toOptions = (record) =>
    Object.entries(record).map(([value, label]) => ({ value, label }))

const selectedLabels = (selected, labels) => {
    if (!Array.isArray(selected) || selected.length === 0) return '-'
    return selected.map((value) => labels[value] || value).join(', ')
}

const getSelectedName = (items, id) => {
    if (!id) return '-'
    return items.find((item) => String(item.id) === String(id))?.name || '-'
}

const isPageOutOfRange = (error) => error?.response?.status === 404

function MultiFilter({ id, label, value = [], choices, onChange }) {
    return (
        <FormControl fullWidth size="small" variant="outlined" sx={{ mt: 2 }}>
            <InputLabel id={`${id}-label`}>{label}</InputLabel>
            <Select
                labelId={`${id}-label`}
                id={id}
                label={label}
                multiple
                value={Array.isArray(value) ? value : []}
                onChange={(event) => {
                    const next = event.target.value
                    onChange(typeof next === 'string' ? next.split(',') : next)
                }}
                renderValue={(selected) =>
                    selected.length ? `${label}: ${selected.length}` : 'Все'
                }
            >
                {choices.map((choice) => (
                    <MenuItem key={choice.value} value={choice.value}>
                        <Checkbox size="small" checked={value.includes(choice.value)} />
                        {choice.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export default function AdditionalServicesList() {
    const navigate = useNavigate()
    const location = useLocation()
    const { hasPermission } = useAuth()

    const canAdd = hasPermission('additional_services.add_additionalservicerequest')
    const canDelete = hasPermission('additional_services.delete_additionalservicerequest')

    const [page, setPage] = useState(1)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    })

    const {
        filters,
        draftFilters,
        applyFilters,
        resetFilters,
        handleDraftFilterChange,
    } = useFilters(INITIAL_FILTERS, STORAGE_KEY)

    const { data: customers = [] } = useGetCustomers()
    const { data: customerObjects = [] } = useGetCustomerObjects(draftFilters.customerId)
    const { data: appliedObjects = [] } = useGetCustomerObjects(filters.customerId)

    // Previously saved filters must not silently constrain the simplified list.
    const effectiveFilters = { ...filters, types: [], compositions: [] }
    const listing = useAdditionalServices(effectiveFilters, page)
    const deletion = useDeleteAdditionalService()

    const rows = listing.error ? [] : (listing.data?.results ?? [])
    const totalCount = listing.data?.count ?? 0
    const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    const isBusy = listing.isLoading || deletion.isPending

    useEffect(() => {
        if (page <= 1) return

        if (listing.data && page > pageCount) {
            setPage(pageCount)
        } else if (isPageOutOfRange(listing.error)) {
            setPage((current) => Math.max(1, current - 1))
        }
    }, [listing.data, listing.error, page, pageCount])

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity })
    }

    const updateDraft = (field, value) => {
        handleDraftFilterChange(field, value)
        if (field === 'customerId') {
            handleDraftFilterChange('objectId', '')
        }
    }

    const handleApplyFilters = () => {
        if (deletion.isPending) return
        setPage(1)
        applyFilters()
    }

    const handleResetFilters = () => {
        if (deletion.isPending) return
        setPage(1)
        resetFilters()
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget || deletion.isPending) return

        const nextPage = Math.min(
            page,
            Math.max(1, Math.ceil((totalCount - 1) / PAGE_SIZE)),
        )

        try {
            await deletion.mutateAsync(deleteTarget.id)
        } catch (error) {
            showSnackbar(firstError(error) || 'Не удалось удалить заявку.', 'error')
            return
        }

        setDeleteTarget(null)

        if (nextPage < page) {
            setPage(nextPage)
            return
        }

        try {
            await listing.refetch({ throwOnError: true })
        } catch {
            showSnackbar('Заявка удалена, но не удалось обновить список.', 'warning')
        }
    }

    const fromDate = filters.dateFrom
        ? formatFilteringDate(filters.dateFrom, false)
        : ''
    const toDate = filters.dateTo
        ? formatFilteringDate(filters.dateTo, true)
        : ''

    const dateStr = fromDate && toDate
        ? (filters.dateFrom === filters.dateTo ? toDate : `${fromDate}–${toDate}`)
        : (fromDate || toDate || 'Все даты')

    const summaryItems = [
        {
            key: 'customer',
            label: 'Контрагент',
            value: getSelectedName(customers, filters.customerId),
        },
        {
            key: 'object',
            label: 'Объект',
            value: getSelectedName(appliedObjects, filters.objectId),
        },
        {
            key: 'status',
            label: 'Статус',
            value: STATUSES[filters.status] || '-',
        },
        {
            key: 'direction',
            label: 'Направление',
            value: selectedLabels(filters.directions, DIRECTIONS),
        },
        ...(filters.providers?.length
            ? [{
                key: 'providers',
                label: 'Исполнитель',
                value: selectedLabels(filters.providers, PROVIDERS),
            }]
            : []),
        ...(filters.itemName
            ? [{ key: 'itemName', label: 'Наименование услуги', value: filters.itemName }]
            : []),
    ]

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs />

            <PageHeader
                title="Дополнительные услуги"
                actions={
                    canAdd && (
                        <AddAction
                            onClick={() =>
                                navigate('/additional-services/create', {
                                    state: { from: location.pathname },
                                })
                            }
                            disabled={isBusy}
                            loading={listing.isLoading}
                        />
                    )
                }
            />

            <Divider />

            <FilterSummary
                dateStr={dateStr}
                leading={
                    <ExpandAction
                        open={filtersOpen}
                        onClick={() => setFiltersOpen((previous) => !previous)}
                    />
                }
                trailing={
                    <ResetAction
                        onClick={handleResetFilters}
                        disabled={isBusy}
                        loading={isBusy}
                    />
                }
                items={summaryItems}
            />

            <Collapse in={filtersOpen}>
                <Box sx={sx.filters}>
                    <DateRangeFields
                        filters={draftFilters}
                        onChange={handleDraftFilterChange}
                        fromId="as-date-from"
                        toId="as-date-to"
                        fromValue={draftFilters.dateFrom}
                        toValue={draftFilters.dateTo}
                        onFromChange={(value) => handleDraftFilterChange('dateFrom', value)}
                        onToChange={(value) => handleDraftFilterChange('dateTo', value)}
                    />

                    <Box sx={sx.filterColumn}>
                        <AppSelectField
                            id="as-customer"
                            label="Контрагент"
                            value={draftFilters.customerId}
                            options={customers}
                            onChange={(value) => updateDraft('customerId', value)}
                            searchable
                            fullWidth
                        />
                        <AppSelectField
                            id="as-object"
                            label="Объект"
                            value={draftFilters.objectId}
                            options={customerObjects}
                            onChange={(value) => updateDraft('objectId', value)}
                            disabled={!draftFilters.customerId}
                            searchable
                            fullWidth
                        />
                    </Box>

                    <Box sx={sx.filterColumn}>
                        <AppSelectField
                            id="as-status"
                            label="Статус"
                            value={draftFilters.status}
                            options={Object.entries(STATUSES).map(([id, name]) => ({ id, name }))}
                            onChange={(value) => updateDraft('status', value)}
                            fullWidth
                        />

                        <MultiFilter
                            id="as-direction"
                            label="Направление"
                            value={draftFilters.directions}
                            choices={toOptions(DIRECTIONS)}
                            onChange={(value) => updateDraft('directions', value)}
                        />
                    </Box>
                </Box>

                <Box sx={sx.filters}>
                    <Box sx={sx.filterColumn}>
                        <MultiFilter
                            id="as-provider"
                            label="Тип исполнителя"
                            value={draftFilters.providers}
                            choices={toOptions(PROVIDERS)}
                            onChange={(value) => updateDraft('providers', value)}
                        />
                    </Box>
                    <Box sx={sx.filterColumn}>
                        <TextField
                            label="Наименование услуги"
                            size="small"
                            margin="normal"
                            fullWidth
                            value={draftFilters.itemName}
                            onChange={(event) => updateDraft('itemName', event.target.value)}
                        />
                    </Box>
                </Box>

                <Box sx={sx.actions}>
                    <ApplyAction
                        onClick={handleApplyFilters}
                        sx={sx.applyButton}
                        disabled={isBusy}
                        loading={isBusy}
                    />
                </Box>
            </Collapse>

            <Divider sx={sx.tableDivider} />

            {listing.error && !(page > 1 && isPageOutOfRange(listing.error)) && (
                <ErrorState
                    error={listing.error}
                    onRetry={listing.refetch}
                    loading={listing.isFetching}
                />
            )}

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headerCellSx}>№</TableCell>
                            <TableCell sx={headerCellSx}>Дата</TableCell>
                            <TableCell sx={headerCellSx}>Направление</TableCell>
                            <TableCell sx={headerCellSx}>Контрагент</TableCell>
                            <TableCell sx={headerCellSx}>Объект</TableCell>
                            <TableCell sx={headerCellSx}>Исполнитель</TableCell>
                            <TableCell sx={headerCellSx}>Статус</TableCell>
                            <TableCell sx={headerCellSx} align="right">Действия</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map((request) => (
                            <TableRow
                                key={request.id}
                                hover
                                onClick={() => navigate(`/additional-services/${request.id}`)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{request.id}</TableCell>
                                <TableCell>{formatDateYear(request.service_date)}</TableCell>
                                <TableCell>{DIRECTIONS[request.direction] || request.direction}</TableCell>
                                <TableCell>
                                    {request.customer_name || (request.customer ? `№ ${request.customer}` : '—')}
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={request.object_name || 'Название объекта не указано'}>
                                        <span>
                                            {request.object_name
                                                || (request.construction_object ? `№ ${request.construction_object}` : '—')}
                                        </span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    {request.provider_name ||
                                        (request.carrier ?? request.repair_company
                                            ? `${PROVIDERS[request.provider_type] || 'Исполнитель'} №${request.carrier ?? request.repair_company}`
                                            : '—')}
                                </TableCell>
                                <TableCell>{STATUSES[request.status] || request.status}</TableCell>
                                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                                    {canDelete && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                            <DeleteAction
                                                loading={deletion.isPending && deleteTarget?.id === request.id}
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    setDeleteTarget(request)
                                                }}
                                            />
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {!listing.isLoading && !listing.error && rows.length === 0 && (
                <Typography color="text.secondary" textAlign="center" sx={{ my: 2 }}>
                    Заявки не найдены.
                </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                    page={page}
                    count={pageCount}
                    onChange={(_, value) => setPage(value)}
                    disabled={listing.isFetching || deletion.isPending}
                />
            </Box>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Удалить заявку?"
                text={
                    deleteTarget
                        ? `Заявка №${deleteTarget.id} будет удалена без возможности восстановления.`
                        : ''
                }
                confirmText="Удалить"
                cancelText="Отмена"
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                loading={deletion.isPending}
            />

            <AppSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() =>
                    setSnackbar((previous) => ({ ...previous, open: false }))
                }
            />
        </Box>
    )
}
