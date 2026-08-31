import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Checkbox, Divider, FormControlLabel, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppSelectField from '../../AppSelectField.jsx'
import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import DateRangeFields from '../../components/DateRangeFields.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import DownloadAction from '../../components/ui/buttons/DownloadAction.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import { useFileUpload } from '../../hooks/useUploadFile.js'
import CustomPagination from '../../pages/components/CustomPagination.jsx'
import { useOrdersFilters } from '../../pages/hooks/useOrdersFilters.js'
import { exportOrdersToExcel } from '../../pages/utils/exportOrders.js'
import { formatDate } from '../../pages/utils/orders.date-filters.js'
import { localeText } from '../../utils/localeDataGridText.js'
import { useGetProducts } from '../catalog/utils/catalog.queries.js'
import { useGetCustomers } from '../customers/utils/customers.queries.js'
import { useGetWarehouses } from '../warehouses/utils/stocks.queries.js'

import { orderFilteringPageSx as sx } from './OrderFilteringPage.styles.js'
import { useViewUpd } from './hooks/useViewUpd.js'
import { getFilterGridOrderColumns } from './utils/filtering_order.columns.jsx'
import { useExportOrders, useGetOrders, useUploadUpd } from './utils/orders.queries.js'

const STORAGE_KEY = 'searching_orders_cache'

const today = formatDate(new Date())

const initialDefaults = {
    dateFrom: today,
    dateTo: today,
    customerId: '',
    warehouseId: '',
    samples: false,
    no_upd: false,
    productId: '',
}

export default function OrderFilteringPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const entity = location.state?.entity

    const { data: customers = [] } = useGetCustomers()
    const { data: warehouses = [] } = useGetWarehouses()
    const { data: products = [] } = useGetProducts()
    const uploadUpd = useUploadUpd()

    const handleUploadUpd = useFileUpload(uploadUpd, {
        successMessage: 'УПД успешно загружен.',
        errorMessage: 'Не удалось загрузить УПД.',
    })

    const { formattedFilters, draftFilters, applyFilters, handleDraftFilterChange } = useOrdersFilters(
        STORAGE_KEY,
        initialDefaults,
        ['samples', 'no_upd'],
    )

    const productValue = products.some((product) => product.id === draftFilters.productId)
        ? draftFilters.productId
        : ''

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    })

    const { data: orders, isPending: loadingOrders } = useGetOrders(formattedFilters)
    const { refetch: fetchDownload, isFetching: isDownloading } = useExportOrders(formattedFilters)

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity,
        })
    }, [])

    const handleViewUpd = useViewUpd(showSnackbar)

    const columns = useMemo(
        () =>
            getFilterGridOrderColumns({
                onUploadUpd: handleUploadUpd,
                onViewUpd: handleViewUpd,
            }),
        [handleUploadUpd, handleViewUpd],
    )

    const handleExport = async () => {
        try {
            const { data } = await fetchDownload()
            const exportOrders = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []

            if (!exportOrders.length) {
                showSnackbar('Нет заявок для экспорта.', 'info')
                return
            }

            await exportOrdersToExcel(exportOrders, formattedFilters, warehouses ?? [])
        } catch {
            showSnackbar('Ошибка при экспорте.', 'error')
        }
    }

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Box sx={sx.header}>
                <Typography variant="h4" fontWeight={600} sx={sx.title}>
                    Поиск заявок
                </Typography>

                <Box sx={sx.headerActions}>
                    <Box sx={sx.exportAction}>
                        <DownloadAction
                            title="Экспорт в Excel"
                            onClick={handleExport}
                            disabled={isDownloading || loadingOrders}
                            loading={isDownloading || loadingOrders}
                        />
                    </Box>
                </Box>
            </Box>

            <Divider />

            <Box sx={sx.filters}>
                <DateRangeFields
                    filters={draftFilters}
                    onChange={handleDraftFilterChange}
                    fromId="orders-date-from"
                    toId="orders-date-to"
                />

                <Box sx={sx.filterColumn}>
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

                <Box sx={sx.filterColumn}>
                    <AppSelectField
                        id="orders-product"
                        label="Продукция"
                        value={productValue}
                        options={products}
                        onChange={(value) => handleDraftFilterChange('productId', value)}
                        fullWidth
                    />

                    <Box sx={sx.checkboxGroup}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={draftFilters.samples === true}
                                    onChange={(event) => handleDraftFilterChange('samples', event.target.checked)}
                                />
                            }
                            label="Образцы"
                            slotProps={sx.checkboxLabel}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={draftFilters.no_upd === true}
                                    onChange={(event) => handleDraftFilterChange('no_upd', event.target.checked)}
                                />
                            }
                            label="Без УПД"
                            slotProps={sx.checkboxLabel}
                        />
                    </Box>
                </Box>
            </Box>

            <Box sx={sx.actions}>
                <ApplyAction onClick={applyFilters} loading={loadingOrders} sx={sx.applyButton} />
            </Box>

            <Divider sx={sx.tableDivider} />

            <DataGrid
                rows={orders ?? []}
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
                localeText={localeText}
                slots={{ pagination: CustomPagination }}
                onRowClick={(params) => navigate(`/orders/${params.row.id}/edit`)}
                sx={sx.dataGrid}
            />

            <AppSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
        </Box>
    )
}
