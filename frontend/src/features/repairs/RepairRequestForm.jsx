import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Divider, Stack, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeaderCreateUpdate from '../../components/PageHeaderCreateUpdate.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'
import { firstError } from '../../utils/apiError.js'
import {
    useGetCustomerContracts,
    useGetCustomerObjects,
    useGetCustomers,
} from '../customers/utils/customers.queries.js'
import { useLoadingError } from '../orders/hooks/useLoadingError.js'
import { useUnsavedGuard } from '../orders/hooks/useUnsavedGuard.js'

import { repairRequestFormSx as sx } from './RepairRequestForm.styles.js'
import RepairRequestDescription from './components/RepairRequestDescription.jsx'
import RepairRequestExecutionFields from './components/RepairRequestExecutionFields.jsx'
import RepairRequestMainFields from './components/RepairRequestMainFields.jsx'
import RepairSpecificationPartsList from './components/RepairSpecificationPartsList.jsx'
import RepairSpecificationServicesList from './components/RepairSpecificationServicesList.jsx'
import { useRepairRequestFormData } from './hooks/useRepairRequestFormData.js'
import { useRepairSpecifications } from './hooks/useRepairSpecifications.js'
import {
    useDeleteClosingFile,
    useDeleteRequestFile,
    useGetRepairFiles,
    useUploadClosingFile,
    useUploadRequestFile,
} from './utils/repair.files.queries.js'
import {
    getRepairRelationId,
    isLegacyLinkedWorkshop,
    isRegulatoryRepair,
    resolveRentalContractSelection,
    toRepairRequestPayload,
} from './utils/repair.form.mappers.js'
import { useGetSpareParts } from './utils/repair.parts.queries.js'
import {
    useCreateRepairRequest,
    useGetRepairCompanies,
    useGetRepairRequest,
    useUpdateRepairRequest,
} from './utils/repair.queries.js'
import { useGetRepairServices } from './utils/repair.services.queries.js'
import { createEmptyRequestForm } from './utils/request.form.constants.js'
import { transitionRepairContextWithDraft } from './utils/repairContextDraft.js'

// Clear only flags on an explicit transition into regulatory maintenance.
// Do not modify positions, quantities, prices, or the originally loaded record.
const clearRebillableFlags = (items) =>
    items.some((item) => Boolean(item.is_rebillable))
        ? items.map((item) => (
            item.is_rebillable ? { ...item, is_rebillable: false } : item
        ))
        : items

export default function RepairRequestFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const {
        data: repairRequest,
        isPending: loadingRequest,
        error: loadRequestError,
        refetch: refetchRequest,
    } = useGetRepairRequest(id, { enabled: isEdit })

    const { data: customers = [] } = useGetCustomers()
    const { data: spareParts = [] } = useGetSpareParts()
    const { data: repairServices = [] } = useGetRepairServices()

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
        try {
            await uploadRequestFile.mutateAsync({
                requestId: id,
                file,
                fileName,
            })

            showSnackbar('Файл успешно загружен', 'success')
        } catch (error) {
            showSnackbar(firstError(error) || 'Не удалось загрузить файл', 'error')
        }
    }

    const handleDeleteRequestFile = async (fileId) => {
        try {
            await deleteRequestFile.mutateAsync({
                requestId: id,
                fileId,
            })

            showSnackbar('Файл удалён', 'success')
        } catch (error) {
            showSnackbar(firstError(error) || 'Не удалось удалить файл', 'error')
        }
    }

    const handleUploadClosingFile = async ({ file, fileName }) => {
        try {
            await uploadClosingFile.mutateAsync({
                requestId: id,
                file,
                fileName,
            })

            showSnackbar('Файл успешно загружен', 'success')
        } catch (error) {
            showSnackbar(firstError(error) || 'Не удалось загрузить файл', 'error')
        }
    }

    const handleDeleteClosingFile = async (fileId) => {
        try {
            await deleteClosingFile.mutateAsync({
                requestId: id,
                fileId,
            })

            showSnackbar('Закрывающий файл удалён.', 'success')
        } catch (error) {
            console.error('Ошибка удаления закрывающего файла:', error)
            showSnackbar(firstError(error) || 'Не удалось удалить закрывающий файл.', 'error')
        }
    }

    const saving = createRepairRequest.isPending || updateRepairRequest.isPending
    const isLoadingPage = isEdit && (loadingRequest || loadingFiles || !repairRequest)
    const pageLoadError = loadRequestError

    const {
        specifications,
        setSpecifications,
        serviceSpecifications,
        partSpecifications,
        specificationErrors,
        totalPrice,
        totalRebillablePrice,
        totalServicesPrice,
        totalServicesPriceRebillable,
        totalPartsPrice,
        totalPartsPriceRebillable,
        normalizeSpecifications,
        buildSpecificationsPayload,
        validate: validateSpecifications,
        handleAddService,
        handleAddPart,
        handleChange: updateSpecification,
        handleRemove: handleSpecificationRemove,
    } = useRepairSpecifications()

    const markCleanRef = useRef(null)
    const [contractSubmitAttempted, setContractSubmitAttempted] = useState(false)
    // The active contract is fetched asynchronously; read the latest value on submit.
    const selectedContractIdRef = useRef('')

    // Kept only in memory while the form is open; never included in the payload.
    const rentalContextDraftRef = useRef(null)
    useEffect(() => {
        // Navigating to another request must not restore the previous request's relations.
        rentalContextDraftRef.current = null
    }, [id, isEdit])

    const {
        form,
        setForm,
        error: formError,
        setError,
        onChange,
        onSubmit,
    } = useFormLogic({
        isEdit,
        id,
        emptyForm: createEmptyRequestForm,
        updateMutation: updateRepairRequest,
        createMutation: createRepairRequest,
        redirectPath: '/repair/requests',

        toPayload: (form) =>
            toRepairRequestPayload(
                form,
                buildSpecificationsPayload(specifications),
                isEdit ? repairRequest : null,
                selectedContractIdRef.current,
            ),

        validate: validateSpecifications,
        onSuccess: () => {
            rentalContextDraftRef.current = null
            markCleanRef.current?.()
        },
    })

    const { isDirty, markClean } = useRepairRequestFormData({
        isEdit,
        repairRequest,
        isLoadingPage,
        pageLoadError,
        form,
        specifications,
        setForm,
        setSpecifications,
        normalizeSpecifications,
    })

    markCleanRef.current = markClean

    const { confirmOpen, handleConfirm, handleCancel } = useUnsavedGuard(isDirty && !saving)

    const { data: customerObjects = [] } = useGetCustomerObjects(form.customerId)
    const {
        data: customerContracts = [],
        isLoading: contractsLoading,
        isError: contractsError,
    } = useGetCustomerContracts(form.customerId)
    const selectedContractId = resolveRentalContractSelection(form, customerContracts)
    selectedContractIdRef.current = selectedContractId
    const isLegacyWorkshop = isLegacyLinkedWorkshop(isEdit ? repairRequest : null)
    const showRentalContext =
        form.location === 'site' ||
        Boolean(form.is_after_return) ||
        (isLegacyWorkshop &&
            form.location === 'workshop' &&
            (Boolean(form.customerId) || getRepairRelationId(form.construction_object) || selectedContractId))
    const isRegulatory = isRegulatoryRepair(form) && !showRentalContext
    const originalHadRentalContext = Boolean(
        getRepairRelationId(repairRequest?.construction_object) || getRepairRelationId(repairRequest?.rental_contract),
    )
    const contextWillBeCleared = isEdit && isRegulatory && originalHadRentalContext
    const needContract = form.location === 'site' || Boolean(form.is_after_return)
    const missingObject = needContract && !getRepairRelationId(form.construction_object)
    const originalObjectId = getRepairRelationId(repairRequest?.construction_object)
    const currentObjectId = getRepairRelationId(form.construction_object)
    const customerChanged = String(form.customerId || '') !== String(repairRequest?.construction_object?.customer ?? '')
    const objectChanged = String(currentObjectId ?? '') !== String(originalObjectId ?? '')
    const isUnchangedLegacySite =
        isEdit &&
        repairRequest?.location === 'site' &&
        !repairRequest?.rental_contract &&
        !customerChanged &&
        !objectChanged &&
        !form.is_after_return
    const missingRequiredContract = needContract && !selectedContractId && !isUnchangedLegacySite
    const removingExistingContract =
        needContract && isEdit && Boolean(repairRequest?.rental_contract) && !selectedContractId
    const contractValidationMessage = missingObject
        ? 'Выберите объект ремонта.'
        : removingExistingContract || missingRequiredContract
          ? contractsLoading
              ? 'Дождитесь загрузки договоров аренды.'
              : contractsError
                ? 'Не удалось загрузить договоры аренды.'
                : 'Выберите договор аренды выбранного контрагента.'
          : ''

    const handleSpecificationChange = (rowId, updates) => {
        // Defensive guard: a regulatory repair cannot mark a line for rebilling.
        const safeUpdates = isRegulatory && updates?.is_rebillable === true
            ? { ...updates, is_rebillable: false }
            : updates
        updateSpecification(rowId, safeUpdates)
    }

    const handleSelectChange = (field, value) => {
        if (
            field === 'rental_contract' ||
            field === 'location' ||
            field === 'is_after_return' ||
            field === 'construction_object'
        ) {
            setContractSubmitAttempted(false)
        }
        // Only mode toggles can restore an unsaved rental context. The saved
        // regulatory form itself continues to have empty rental relations.
        const { form: nextForm, draft } = transitionRepairContextWithDraft(
            form,
            field,
            value,
            rentalContextDraftRef.current,
        )
        if (field === 'location' || field === 'is_after_return') {
            rentalContextDraftRef.current = draft
        }
        // Clear rebilling flags only on an explicit switch to regulatory repair.
        if (!isRegulatoryRepair(form) && isRegulatoryRepair(nextForm)) {
            setSpecifications(clearRebillableFlags)
        }
        setForm(nextForm)
    }

    // ExecutionFields can use either onChange('location') or onSelectChange.
    const handleExecutionChange = (field) =>
        field === 'location' ? (event) => handleSelectChange(field, event.target.value) : onChange(field)

    const handleSubmit = (event) => {
        if (isRegulatory && buildSpecificationsPayload(specifications).some((item) => Boolean(item.is_rebillable))) {
            event.preventDefault()
            setError('Для регламентного ремонта отключите перевыставление расходов во всех позициях.')
            return
        }
        if (contractValidationMessage) {
            event.preventDefault()
            setContractSubmitAttempted(true)
            return
        }
        setContractSubmitAttempted(false)
        setError(null)
        onSubmit(event)
    }

    const handleCustomerChange = (value) => {
        setContractSubmitAttempted(false)
        const nextForm = {
            ...form,
            customerId: value,
            construction_object: '',
            rental_contract: null,
        }
        if (!isRegulatoryRepair(form) && isRegulatoryRepair(nextForm)) {
            setSpecifications(clearRebillableFlags)
        }
        setForm((prev) => ({
            ...prev,
            customerId: value,
            construction_object: '',
            rental_contract: null,
        }))
    }

    useLoadingError(setError, {
        loadRequestError,
    })

    const formatPrice = (value) =>
        Number(value || 0).toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })

    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />

            <Box component="form" noValidate onSubmit={handleSubmit} sx={sx.form}>
                <Box sx={sx.header}>
                    <PageHeaderCreateUpdate
                        isEdit={isEdit}
                        orderId={id}
                        saving={saving}
                        saveDisabled={isEdit && !isDirty}
                        newOrder="Заявка на ремонт"
                        editOrder="Редактирование заявки на ремонт"
                    />
                </Box>

                <Divider sx={sx.divider} />

                {formError && !pageLoadError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {formError}
                    </Alert>
                )}

                {pageLoadError ? (
                    <ErrorState
                        error={pageLoadError}
                        onRetry={() => {
                            if (isEdit) {
                                void refetchRequest()
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
                                originalRequest={isEdit ? repairRequest : null}
                                customers={customers}
                                customerObjects={customerObjects}
                                repairCompanies={repairCompanies}
                                customerContracts={customerContracts}
                                contractsLoading={contractsLoading}
                                contractsError={contractsError}
                                selectedContractId={selectedContractId}
                                contractError={contractSubmitAttempted ? contractValidationMessage : ''}
                                showRentalContext={showRentalContext}
                                isRegulatory={isRegulatory}
                                contextWillBeCleared={contextWillBeCleared}
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
                                onAfterReturnChange={(value) => handleSelectChange('is_after_return', value)}
                                onChange={handleExecutionChange}
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

            {isRegulatory && (
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, mb: 1 }}>
                    Регламентный ремонт: расходы не перевыставляются заказчику.
                </Typography>
            )}

            <Box sx={sx.specificationSection}>
                <Stack sx={sx.specificationHeader} direction="row">
                    <Typography variant="h6" sx={sx.specificationGrandTotalValue}>
                        УСЛУГИ
                    </Typography>
                    <AddAction onClick={handleAddService} />
                </Stack>

                <Divider sx={sx.divider} />

                <RepairSpecificationServicesList
                    disableRebillable={isRegulatory}
                    rows={serviceSpecifications}
                    serviceErrors={specificationErrors}
                    servicesList={repairServices}
                    onChange={handleSpecificationChange}
                    onRemove={handleSpecificationRemove}
                    totalServicesPrice={formatPrice(totalServicesPrice)}
                    totalServicesPriceRebillable={formatPrice(totalServicesPriceRebillable)}
                />
            </Box>

            <Box sx={sx.specificationSection}>
                <Stack sx={sx.specificationHeader} direction="row">
                    <Typography variant="h6" sx={sx.specificationGrandTotalValue}>
                        ЗАПЧАСТИ
                    </Typography>

                    <AddAction onClick={handleAddPart} />
                </Stack>

                <Divider sx={sx.divider} />

                <RepairSpecificationPartsList
                    disableRebillable={isRegulatory}
                    rows={partSpecifications}
                    partErrors={specificationErrors}
                    partsList={spareParts}
                    onChange={handleSpecificationChange}
                    onRemove={handleSpecificationRemove}
                    totalPartsPrice={formatPrice(totalPartsPrice)}
                    totalPartsPriceRebillable={formatPrice(totalPartsPriceRebillable)}
                />
            </Box>

            <Box sx={sx.specificationGrandTotal}>
                <Typography variant="h6">ИТОГО ПО ЗАЯВКЕ:</Typography>

                <Typography variant="h6" sx={sx.specificationGrandTotalValue}>
                    {formatPrice(totalPrice)} руб.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    (в том числе клиенту: {formatPrice(totalRebillablePrice)} руб.)
                </Typography>
            </Box>

            <ConfirmDialog
                open={confirmOpen}
                title="Есть несохранённые изменения"
                text="Вы изменили форму. Уйти без сохранения?"
                confirmText="Уйти"
                cancelText="Остаться"
                onClose={handleCancel}
                onConfirm={handleConfirm}
            />

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </Box>
    )
}
