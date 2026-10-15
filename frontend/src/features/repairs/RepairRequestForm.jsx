import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Box, CircularProgress, Divider, Stack, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeaderCreateUpdate from '../../components/PageHeaderCreateUpdate.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'
import { useGetCustomerObjects, useGetCustomers } from '../customers/utils/customers.queries.js'
import { useLoadingError } from '../orders/hooks/useLoadingError.js'

import { repairRequestFormSx as sx } from './RepairRequestForm.styles.js'
import RepairRequestDescription from './components/RepairRequestDescription.jsx'
import RepairRequestExecutionFields from './components/RepairRequestExecutionFields.jsx'
import RepairRequestMainFields from './components/RepairRequestMainFields.jsx'
import RepairSpecificationPartsList from './components/RepairSpecificationPartsList.jsx'
import { useRequestParts } from './hooks/useRequestParts.js'
import {
    useCreateRepairRequest,
    useGetRepairCompanies,
    useGetRepairRequest,
    useGetSpareParts,
    useUpdateRepairRequest,
} from './utils/repair.queries.js'
import {
    useDeleteClosingFile,
    useDeleteRequestFile,
    useGetRepairFiles,
    useUploadClosingFile,
    useUploadRequestFile,
} from './utils/repeir.files.queries.js'
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
    const { data: spareParts = [] } = useGetSpareParts()

    const createRepairRequest = useCreateRepairRequest()
    const updateRepairRequest = useUpdateRepairRequest()
    const { data: repairCompanies = [] } = useGetRepairCompanies()
    const { data: repairFiles, isLoading: loadingFiles } = useGetRepairFiles(id)

    const uploadRequestFile = useUploadRequestFile()
    const deleteRequestFile = useDeleteRequestFile()

    const uploadClosingFile = useUploadClosingFile()
    const deleteClosingFile = useDeleteClosingFile()

    const filesData = Array.isArray(repairFiles) ? repairFiles[0] : repairFiles

    const requestFiles = filesData?.request_files ?? []
    const closingFiles = filesData?.closing_files ?? []

    const handleUploadRequestFile = async ({ file, fileName }) => {
        await uploadRequestFile.mutateAsync({
            requestId: id,
            file,
            fileName,
        })
    }

    const handleDeleteRequestFile = async (fileId) => {
        await deleteRequestFile.mutateAsync({
            requestId: id,
            fileId,
        })
    }

    const handleUploadClosingFile = async ({ file, fileName }) => {
        await uploadClosingFile.mutateAsync({
            requestId: id,
            file,
            fileName,
        })
    }

    const handleDeleteClosingFile = async (fileId) => {
        await deleteClosingFile.mutateAsync({
            requestId: id,
            fileId,
        })
    }

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
        redirectToCreated: true,

        toPayload: (form) => ({
            request_date: form.request_date,
            closing_date: form.closing_date || null,
            status: form.status,
            location: form.location,
            repair_company: form.repair_company,
            construction_object: form.construction_object,
            description: form.description,
            closing_description: form.closing_description,
        }),

        onSuccess: () => markCleanRef.current?.(),
    })

    useEffect(() => {
        if (!repairRequest) {
            return
        }

        setForm({
            ...emptyRequestForm,

            id: repairRequest.id,
            request_date: repairRequest.request_date ?? '',
            closing_date: repairRequest.closing_date ?? '',
            status: repairRequest.status ?? 'open',
            location: repairRequest.location ?? 'site',

            repair_company: repairRequest.repair_company ?? '',

            customerId: repairRequest.construction_object?.customer ?? '',

            construction_object: repairRequest.construction_object?.id ?? '',

            description: repairRequest.description ?? '',
            closing_description: repairRequest.closing_description ?? '',
        })
    }, [repairRequest, setForm])

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

    const {
        requestParts,
        setRequestParts,
        partsErrors,
        totalPartsPrice,
        normalizeRequestParts,
        buildPartsPayload,
        validate: validateParts,
        handleAdd: handleAddPartRow,
        handleChange: handlePartChange,
        handleRemove: handleRemovePartRow,
    } = useRequestParts()

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
                        orderId={id}
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
                            <RepairRequestMainFields
                                form={form}
                                customers={customers}
                                customerObjects={customerObjects}
                                repairCompanies={repairCompanies}
                                onChange={onChange}
                                onSelectChange={handleSelectChange}
                                onCustomerChange={handleCustomerChange}
                                requestId={id}
                                requestFiles={requestFiles}
                                onUploadFile={handleUploadRequestFile}
                                onDeleteFile={handleDeleteRequestFile}
                                uploadingFile={uploadRequestFile.isPending}
                            />

                            <RepairRequestExecutionFields
                                form={form}
                                onChange={onChange}
                                onSelectChange={handleSelectChange}
                                requestId={id}
                                closingFiles={closingFiles}
                                onUploadFile={handleUploadClosingFile}
                                onDeleteFile={handleDeleteClosingFile}
                                uploadingFile={uploadClosingFile.isPending}
                            />

                            <RepairRequestDescription form={form} onChange={onChange} />
                        </Box>
                    </>
                )}
            </Box>

            <Divider sx={sx.divider} />

            <Box sx={sx.header}>
                <Stack direction="row" justifyContent="space-between" sx={{ p: 1 }}>
                    <Typography variant="h6">Оказанные услуги:</Typography>
                    <AddAction onClick={handleAddPartRow} />
                </Stack>
                <Divider sx={sx.divider} />
            </Box>

            <Box sx={sx.header}>
                <Stack direction="row" justifyContent="space-between" sx={{ p: 1 }}>
                    <Typography variant="h6">Запчасти:</Typography>
                    <AddAction onClick={handleAddPartRow} />
                </Stack>
                <Divider sx={sx.divider} />

                {!pageLoadError && !isLoadingPage && (
                    <Box>
                        <RepairSpecificationPartsList
                            rows={requestParts}
                            partErrors={partsErrors}
                            partsList={spareParts}
                            onChange={handlePartChange}
                            onRemove={handleRemovePartRow}
                        />
                    </Box>
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
