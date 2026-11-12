import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Alert, Backdrop, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AppBreadcrumbs from '../components/AppBreadcrumbs.jsx'
import FilterSummary from '../components/FilterSummary.jsx'
import PageHeader from '../components/PageHeader.jsx'
import AddAction from '../components/ui/buttons/AddAction.jsx'
import DownloadAction from '../components/ui/buttons/DownloadAction.jsx'
import AppSnackbar from '../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../components/ui/feedback/ConfirmDialog.jsx'
import { useGetCustomers } from '../features/customers/utils/customers.queries.js'
import OrderMobileList from '../features/orders/components/OrderMobileList.jsx'
import { useDeleteOrderFlow } from '../features/orders/hooks/useDeleteOrderFlow.js'
import { useOrdersFilters } from '../features/orders/hooks/useOrdersFilters.js'
import { useExportOrders, useGetOrders, useUploadUpd } from '../features/orders/utils/orders.queries.js'
import { useGetWarehouses } from '../features/warehouses/utils/stocks.queries.js'
import { useFileUpload } from '../hooks/useUploadFile.js'
import { sidebarPageSx } from '../layouts/AppSidebar.jsx'
import { localeText } from '../utils/localeDataGridText.js'

import { getHomeContentSx, homeSx as sx } from './Home.styles.js'
import Can from './auth/components/Can.jsx'
import { useAuth } from './auth/context/AuthContext.jsx'
import { PERMISSIONS } from './auth/permissions.js'
import CustomPagination from './components/CustomPagination.jsx'
import FilterSidebar from './components/FilterSidebar.jsx'
import { formatFilteringDate, prepareOrdersExcelFile } from './utils/exportOrders.js'
import { getAssignedDriverName, preparePowerOfAttorneyFiles } from './utils/exportPowerOfAttorney.jsx'
import { prepareQualityPassportFiles } from './utils/exportQualityPassports.jsx'
import { buildExportFolderName, buildZipBlob, canChooseExportDirectory, downloadPreparedZip, saveFilesInChosenFolder, validateExportFileNames } from './utils/saveExportFiles.js'
import { getHomeGridOrderColumns } from './utils/home_order.columns.jsx'
import { formatDate } from './utils/orders.date-filters.js'

const ORDER_STATUS_OPTIONS = [
    { value: 'draft', label: 'Черновик' },
    { value: 'created', label: 'Создана' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Завершена' },
]

const STORAGE_KEY = 'orders_filters_cache'

const today = formatDate(new Date())

const initialDefaults = {
    dateFrom: today,
    dateTo: today,
    status: '',
    customerId: '',
    warehouseId: '',
    selectedPreset: 'today',
}

const Home = () => {
    const { hasPermission } = useAuth()

    const canChangeOrders = hasPermission(PERMISSIONS.orders.change)
    const canDeleteOrders = hasPermission(PERMISSIONS.orders.delete)
    const canManageOrderUpd = hasPermission(PERMISSIONS.orders.manageUpd)
    const navigate = useNavigate()
    const location = useLocation()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [exportingDocuments, setExportingDocuments] = useState(false)
    const [preparedExport, setPreparedExport] = useState(null)
    const [savedCount, setSavedCount] = useState(0)

    const [snackbarQueue, setSnackbarQueue] = useState([])
    const currentSnackbar = snackbarQueue[0] ?? null

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarQueue([{ id: crypto.randomUUID(), message, severity }])
    }

    const showExportSnackbars = ({ orderCount, fileCount, missingDriverIds, usedDirectory }) => {
        const successMessage = usedDirectory
            ? `Выгрузка завершена. Заявок: ${orderCount}, сохранено файлов: ${fileCount}.`
            : `Выгрузка подготовлена. Заявок: ${orderCount}, файлов в ZIP: ${fileCount}.`

        const notifications = [{ id: crypto.randomUUID(), message: successMessage, severity: 'success' }]
        if (missingDriverIds.length) {
            notifications.push({
                id: crypto.randomUUID(),
                message: `Не назначен водитель в заявках — № ${missingDriverIds.join(', № ')}.`,
                severity: 'warning',
            })
        }
        setSnackbarQueue(notifications)
    }

    const {
        formattedFilters,
        draftFilters,
        setDraftFilters,
        selectedPreset,
        applyFilters,
        handlePresetClick,
        handleDraftFilterChange,
    } = useOrdersFilters(STORAGE_KEY, initialDefaults)

    const { data: orders, isPending: loadingOrders, isError: ordersError } = useGetOrders(formattedFilters)
    const { data: customers } = useGetCustomers()
    const { data: warehouses } = useGetWarehouses()

    const { refetch: fetchDownload, isFetching: isDownloading } = useExportOrders({
        ...formattedFilters,
        status: 'created',
    })
    const exportLocked = exportingDocuments || isDownloading || Boolean(preparedExport)
    const uploadUpd = useUploadUpd()
    const { orderToDelete, setOrderToDelete, handleConfirmDelete, isDeleting } = useDeleteOrderFlow(() =>
        showSnackbar('Заявка удалена'),
    )
    const startPeriod = formatFilteringDate(formattedFilters.dateFrom, false)
    const endPeriod = formatFilteringDate(formattedFilters.dateTo, true)

    const dateStr = formattedFilters.dateFrom === formattedFilters.dateTo ? endPeriod : `${startPeriod}-${endPeriod}`

    const customerInputValue = Array.isArray(customers)
        ? customers.find((customer) => customer.id === formattedFilters.customerId)?.name || '-'
        : '-'

    const warehouseInputValue = Array.isArray(warehouses)
        ? warehouses.find((warehouse) => warehouse.id === formattedFilters.warehouseId)?.name || '-'
        : '-'

    const selectedStatus = ORDER_STATUS_OPTIONS.find((status) => status.value === formattedFilters.status)?.label || '-'

    const handleUploadUpd = useFileUpload(uploadUpd, showSnackbar, {
        successMessage: 'УПД успешно загружен.',
        deleteSuccessMessage: 'УПД успешно удалён.',
        errorMessage: 'Не удалось изменить УПД.',
    })


    const columns = useMemo(
        () =>
            getHomeGridOrderColumns({
                onDelete: setOrderToDelete,
                onUploadUpd: handleUploadUpd,
                canDelete: canDeleteOrders && !exportLocked,
                canManageUpd: canManageOrderUpd && !exportLocked,
            }),
        [setOrderToDelete, handleUploadUpd, canDeleteOrders, canManageOrderUpd, exportLocked],
    )

    const handleExport = async () => {
        if (exportingDocuments || preparedExport) return

        const warehouseList = warehouses ?? []
        if (!warehouseList.some((warehouse) => String(warehouse.id) === String(formattedFilters.warehouseId))) {
            showSnackbar('Склад не выбран!', 'error')
            return
        }
        if (formattedFilters.status && formattedFilters.status !== 'created') {
            showSnackbar('Неправильная фильтрация заявок: выберите статус «Создана» или «Все».', 'error')
            return
        }

        setExportingDocuments(true)
        setSavedCount(0)
        try {
            const { data, error } = await fetchDownload()
            if (error) throw error
            const received = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
            // Never include orders of another status, even if backend filtering changes.
            const selected = received.filter((order) => order.status === 'created')
            if (!selected.length) {
                showSnackbar('Нет заявок для выгрузки.', 'info')
                return
            }

            const missingDriverIds = selected
                .filter((order) => !getAssignedDriverName(order))
                .map((order) => order.id)

            const excel = await prepareOrdersExcelFile(selected, { ...formattedFilters, status: 'created' }, warehouseList)
            const powersOfAttorney = await preparePowerOfAttorneyFiles(selected)
            const qualityPassports = await prepareQualityPassportFiles(selected)
            const files = [excel, ...powersOfAttorney, ...qualityPassports]
            validateExportFileNames(files)

            const zipBlob = canChooseExportDirectory() ? null : await buildZipBlob(files)
            setPreparedExport({
                files,
                zipBlob,
                folderName: buildExportFolderName(),
                orderCount: selected.length,
                powerCount: powersOfAttorney.length,
                passportCount: qualityPassports.length,
                missingDriverIds,
            })
        } catch (error) {
            console.error('Ошибка подготовки документов заявок:', error)
            showSnackbar('Не удалось подготовить документы. Файлы не сохранялись.', 'error')
        } finally {
            setExportingDocuments(false)
        }
    }

    const handleSavePreparedExport = async () => {
        if (!preparedExport || exportingDocuments) return
        setSavedCount(0)
        const { files, folderName, missingDriverIds, zipBlob, orderCount } = preparedExport
        const useDirectory = canChooseExportDirectory()
        setExportingDocuments(true)

        try {
            if (useDirectory) {
                await saveFilesInChosenFolder(files, folderName, setSavedCount)
            } else {
                downloadPreparedZip(zipBlob, folderName)
            }

            setPreparedExport(null)
            showExportSnackbars({
                orderCount,
                fileCount: files.length,
                missingDriverIds,
                usedDirectory: useDirectory,
            })
        } catch (error) {
            if (error?.name !== 'AbortError') {
                console.error('Ошибка сохранения документов:', error)
                showSnackbar('Ошибка записи документов. Проверьте выбранную папку и повторите сохранение.', 'error')
            }
        } finally {
            setExportingDocuments(false)
        }
    }

    const handleOpenOrder = (id) => {
        if (exportLocked) return
        navigate(canChangeOrders ? `/orders/${id}/edit` : `/orders/${id}`)
    }

    return (
        <Box sx={sidebarPageSx.page}>
            <Backdrop
                open={exportingDocuments && !preparedExport}
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fff', flexDirection: 'column', gap: 1.5 }}
            >
                <CircularProgress color="inherit" />
                <Typography variant="body2">Подготовка документов…</Typography>
            </Backdrop>
            <FilterSidebar
                open={sidebarOpen}
                setOpen={setSidebarOpen}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                onApply={applyFilters}
                onPresetClick={handlePresetClick}
                selectedPreset={selectedPreset}
                handleDraftFilterChange={handleDraftFilterChange}
                customers={customers ?? []}
                warehouses={warehouses ?? []}
                statusOptions={ORDER_STATUS_OPTIONS}
            />

            <Box sx={getHomeContentSx(sidebarOpen)}>
                <Container maxWidth="xl" sx={sx.container}>
                    <Box sx={sx.breadcrumbs}>
                        <AppBreadcrumbs />
                    </Box>

                    <PageHeader
                        title="Заявки"
                        actions={
                            <>
                                <Can permission={PERMISSIONS.orders.export}>
                                    <Box sx={sx.exportAction}>
                                        <DownloadAction
                                            title="Экспорт заявок, доверенностей и паспортов качества"
                                            onClick={handleExport}
                                            disabled={exportLocked || loadingOrders || uploadUpd.isPending}
                                            loading={exportingDocuments || isDownloading || loadingOrders}
                                        />
                                    </Box>
                                </Can>

                                <Can permission={PERMISSIONS.orders.add}>
                                    <AddAction
                                        onClick={() =>
                                            navigate('/orders/create', {
                                                state: {
                                                    from: location.pathname,
                                                },
                                            })
                                        }
                                        disabled={exportLocked || loadingOrders || uploadUpd.isPending}
                                        loading={loadingOrders}
                                    />
                                </Can>
                            </>
                        }
                    />

                    <Divider />

                    <FilterSummary
                        dateStr={dateStr}
                        items={[
                            {
                                key: 'status',
                                label: 'Статус',
                                value: selectedStatus,
                            },
                            {
                                key: 'customer',
                                label: 'Контрагент',
                                value: customerInputValue,
                            },
                            {
                                key: 'warehouse',
                                label: 'Склад',
                                value: warehouseInputValue,
                            },
                        ]}
                    />

                    <Divider sx={sx.divider} />

                    <OrderMobileList
                        orders={orders ?? []}
                        loading={loadingOrders}
                        onOpen={handleOpenOrder}
                        onDelete={setOrderToDelete}
                        onUploadUpd={handleUploadUpd}
                        canDelete={canDeleteOrders && !exportLocked}
                        canManageUpd={canManageOrderUpd && !exportLocked}
                    />

                    <Box sx={sx.desktopGrid}>
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
                            localeText={{
                                ...localeText,
                                noRowsLabel: ordersError ? 'Не удалось загрузить заявки.' : localeText.noRowsLabel,
                            }}
                            slots={{
                                pagination: CustomPagination,
                            }}
                            onRowClick={(params) => handleOpenOrder(params.row.id)}
                            sx={sx.dataGrid}
                        />
                    </Box>

                    <Dialog
                        open={Boolean(preparedExport)}
                        onClose={() => {
                            if (!exportingDocuments) setPreparedExport(null)
                        }}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle sx={{ px: { xs: 3, sm: 5 }, pt: 3, pb: 1 }}>
                            Подготовлено для выгрузки:
                        </DialogTitle>
                        <DialogContent sx={{ px: { xs: 3, sm: 5 }, pt: 1, pb: 1 }}>
                            {preparedExport && (
                                <>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        Количество заявок — {preparedExport.orderCount}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
                                        Файлы для выгрузки:
                                    </Typography>
                                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                                        <Typography variant="body2">Заявки (Excel) — 1</Typography>
                                        <Typography variant="body2">Доверенности — {preparedExport.powerCount}</Typography>
                                        <Typography variant="body2">
                                            Паспорта качества — {preparedExport.passportCount}
                                        </Typography>
                                    </Box>
                                    {preparedExport.missingDriverIds.length > 0 && (
                                        <Alert severity="warning" sx={{ mt: 2.5 }}>
                                            Не назначен водитель в заявках — № {preparedExport.missingDriverIds.join(', № ')}.
                                        </Alert>
                                    )}
                                    {exportingDocuments && canChooseExportDirectory() && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                            Сохранено файлов: {savedCount} из {preparedExport.files.length}
                                        </Typography>
                                    )}
                                </>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: { xs: 3, sm: 5 }, pt: 1.5, pb: 3, gap: 1 }}>
                            <Button disabled={exportingDocuments} onClick={() => setPreparedExport(null)}>
                                Отмена
                            </Button>
                            <Button variant="contained" disabled={exportingDocuments} onClick={handleSavePreparedExport}>
                                {canChooseExportDirectory() ? 'Выбрать папку и сохранить' : 'Скачать ZIP'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <ConfirmDialog
                        open={Boolean(orderToDelete)}
                        title="Удалить заявку?"
                        text={`Заявка №${orderToDelete?.id} будет удалена без возможности восстановления.`}
                        confirmText={isDeleting ? 'Удаление...' : 'Удалить'}
                        cancelText="Отмена"
                        onClose={() => !isDeleting && setOrderToDelete(null)}
                        onConfirm={handleConfirmDelete}
                        loading={isDeleting}
                    />

                    <AppSnackbar
                        key={currentSnackbar?.id ?? 'none'}
                        open={Boolean(currentSnackbar)}
                        message={currentSnackbar?.message ?? ''}
                        severity={currentSnackbar?.severity ?? 'success'}
                        onClose={() => setSnackbarQueue((queue) => queue.slice(1))}
                    />
                </Container>
            </Box>
        </Box>
    )
}

export default Home
