import React, { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Box, CircularProgress, Divider, TextField, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import AppSelectField from '../../components/AppSelectField.jsx'
import FileUploadAction from '../../components/FileUploadAction.jsx'
import PageHeaderCreateUpdate from '../../components/PageHeaderCreateUpdate.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'
import { useGetCustomerObjects, useGetCustomers } from '../customers/utils/customers.queries.js'
import { useLoadingError } from '../orders/hooks/useLoadingError.js'

import { fieldsetStyles, repairRequestFormSx as sx } from './RepairRequestForm.styles.js'
import {
    useCreateRepairRequest,
    useGetRepairCompanies,
    useGetRepairRequest,
    useUpdateRepairRequest,
} from './utils/repair.queries.js'
import { emptyRequestForm, locationOptions, statusOptions } from './utils/request.form.constants.js'

const toSelectOptions = (options) =>
    Object.entries(options).map(([id, name]) => ({
        id,
        name,
    }))

export default function RepairRequestFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)

    const navigate = useNavigate()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const {
        data: repairRequest,
        isPending: loadingRequest,
        error: loadRequestError,
        refetch: refetchRequest,
    } = useGetRepairRequest(id, { enabled: isEdit })

    const { data: customers = [] } = useGetCustomers()

    const createRepairRequest = useCreateRepairRequest()
    const updateRepairRequest = useUpdateRepairRequest()
    const { data: repairCompanies = [] } = useGetRepairCompanies()

    const saving = createRepairRequest.isPending || updateRepairRequest.isPending

    const isLoadingPage = isEdit && (loadingRequest || !repairRequest)

    const pageLoadError = loadRequestError

    const markCleanRef = useRef(null)

    const { form, setForm, setError, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm: emptyRequestForm,
        updateMutation: updateRepairRequest,
        createMutation: createRepairRequest,
        redirectPath: '/repair/requests',

        toPayload: (form) => ({
            request_date: form.request_date,
            closing_date: form.closing_date || null,
            status: form.status,
            location: form.location,
            construction_object: form.construction_object,
            description: form.description,
            closing_description: form.closing_description,
        }),

        onSuccess: () => markCleanRef.current?.(),
    })

    const { data: customerObjects = [] } = useGetCustomerObjects(form.customerId)

    const handleSelectChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleCustomerChange = (value) => {
        setForm((prev) => ({
            ...prev,
            customerId: value,
            construction_object: '',
        }))
    }

    useLoadingError(setError, {
        loadRequestError,
    })

    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />

            <Box component="form" noValidate onSubmit={onSubmit} sx={sx.form}>
                <Box sx={sx.header}>
                    <PageHeaderCreateUpdate
                        isEdit={isEdit}
                        orderId={form.id}
                        saving={saving}
                        newOrder="Заявка на ремонт"
                        editOrder="Редактирование заявки на ремонт"
                    />
                </Box>

                <Divider sx={sx.divider} />

                {pageLoadError ? (
                    <ErrorState
                        error={pageLoadError}
                        onRetry={() => {
                            if (isEdit) {
                                refetchRequest()
                            }
                        }}
                        loading={loadingRequest}
                    />
                ) : isLoadingPage ? (
                    <Box sx={sx.loading}>
                        <CircularProgress aria-label="Загрузка..." />
                    </Box>
                ) : (
                    <>
                        <Box sx={sx.formColumns}>
                            <Box component="fieldset" sx={[fieldsetStyles, sx.fieldset]}>
                                <Typography component="legend" variant="caption" sx={sx.legend}>
                                    Данные заявки:
                                </Typography>

                                <Box sx={sx.fields}>
                                    <TextField
                                        label="Дата открытия заявки"
                                        type="date"
                                        size="small"
                                        value={form.request_date || ''}
                                        onChange={onChange('request_date')}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={sx.field}
                                    />

                                    <AppSelectField
                                        id="repair-company"
                                        label="Ремонтирующая компания"
                                        value={form.repair_company || ''}
                                        options={repairCompanies}
                                        onChange={(value) => handleSelectChange('repair_company', value)}
                                        searchable
                                        fullWidth
                                        sx={{ width: '410px' }}
                                    />

                                    <AppSelectField
                                        id="repair-customer"
                                        label="Контрагент"
                                        value={form.customerId || ''}
                                        options={customers}
                                        onChange={handleCustomerChange}
                                        searchable
                                        includeAll={false}
                                        fullWidth
                                    />

                                    <AppSelectField
                                        id="repair-object"
                                        label="Объект"
                                        value={form.construction_object || ''}
                                        options={customerObjects}
                                        onChange={(value) => handleSelectChange('construction_object', value)}
                                        searchable
                                        includeAll={false}
                                        disabled={!form.customerId}
                                        fullWidth
                                    />
                                </Box>

                                <Box sx={sx.filesSection}>
                                    <Typography variant="caption" sx={sx.filesTitle}>
                                        Файлы
                                    </Typography>

                                    <FileUploadAction />
                                </Box>
                            </Box>

                            <Box component="fieldset" sx={[fieldsetStyles, sx.fieldset]}>
                                <Typography component="legend" variant="caption" sx={sx.legend}>
                                    Выполнение заявки:
                                </Typography>

                                <Box sx={sx.fields}>
                                    <TextField
                                        label="Дата закрытия заявки"
                                        type="date"
                                        size="small"
                                        value={form.closing_date || ''}
                                        onChange={onChange('closing_date')}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={sx.field}
                                    />

                                    <AppSelectField
                                        id="repair-status"
                                        label="Статус"
                                        value={form.status}
                                        options={toSelectOptions(statusOptions)}
                                        onChange={(value) => handleSelectChange('status', value)}
                                        includeAll={false}
                                        fullWidth
                                    />

                                    <AppSelectField
                                        id="repair-location"
                                        label="Место выполнения"
                                        value={form.location}
                                        options={toSelectOptions(locationOptions)}
                                        onChange={(value) => handleSelectChange('location', value)}
                                        includeAll={false}
                                        fullWidth
                                    />
                                </Box>

                                <Box sx={sx.filesSection}>
                                    <Typography variant="caption" sx={sx.filesTitle}>
                                        Файлы
                                    </Typography>

                                    <FileUploadAction />
                                </Box>
                            </Box>

                            <TextField
                                value={form.description || ''}
                                onChange={onChange('description')}
                                label="Описание"
                                multiline
                                fullWidth
                                sx={sx.descriptionField}
                            />
                        </Box>

                        {form.status === 'closed' && (
                            <TextField
                                size="small"
                                label="Описание при закрытии"
                                value={form.closing_description || ''}
                                onChange={onChange('closing_description')}
                                multiline
                                rows={3}
                                fullWidth
                                sx={sx.note}
                            />
                        )}
                    </>
                )}
            </Box>

            <ConfirmDialog
                title="Есть несохранённые изменения"
                text="Вы изменили форму. Уйти без сохранения?"
                confirmText="Уйти"
                cancelText="Остаться"
            />

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </Box>
    )
}
