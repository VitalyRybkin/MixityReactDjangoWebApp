import { Box, TextField, Typography } from '@mui/material'

import AppSelectField from '../../../components/AppSelectField.jsx'
import { fieldsetStyles, repairRequestFormSx as sx } from '../RepairRequestForm.styles.js'
import { withCurrentRepairOption } from '../utils/repair.form.mappers.js'

import RepairFilesSection from './RepairFilesSection.jsx'

const formatContractDate = (date) => {
    if (!date) return '—'
    const [year, month, day] = String(date).split('-')
    return year && month && day ? `${day}.${month}.${year}` : String(date)
}

const contractOptionName = (contract) => {
    const label = `№ ${contract.contract_number} от ${formatContractDate(contract.contract_date)}`
    return `${label} · ${contract.is_active ? 'Действующий' : 'Архивный'}`
}

export default function RepairRequestMainFields({
    form,
    originalRequest,
    customers,
    customerObjects,
    repairCompanies,
    customerContracts,
    contractsLoading,
    contractsError,
    selectedContractId,
    contractError,
    showRentalContext,
    isRegulatory,
    contextWillBeCleared,
    onChange,
    onSelectChange,
    onCustomerChange,

    requestId,
    requestFiles,
    onUploadFile,
    onDeleteFile,
    uploadingFile,
}) {
    const originalObject = originalRequest?.construction_object
    const originalCustomer =
        originalObject?.customer && typeof originalObject.customer === 'object'
            ? originalObject.customer
            : { id: originalObject?.customer, name: originalObject?.customer_name }

    const companyOptions = withCurrentRepairOption(
        repairCompanies,
        form.repair_company,
        originalRequest?.repair_company,
        'Ремонтирующая компания',
    )
    const customerOptions = withCurrentRepairOption(customers, form.customerId, originalCustomer, 'Контрагент')
    const objectOptions = withCurrentRepairOption(customerObjects, form.construction_object, originalObject, 'Объект')
    const originalContract = originalRequest?.rental_contract == null
        ? null
        : {
            id: originalRequest.rental_contract,
            name: `№ ${originalRequest.rental_contract_number || originalRequest.rental_contract} от ${formatContractDate(originalRequest.rental_contract_date)}`,
        }
    const contractOptions = withCurrentRepairOption(
        customerContracts.map((contract) => ({ ...contract, name: contractOptionName(contract) })),
        selectedContractId,
        originalContract,
        'Договор аренды',
    )

    return (
        <Box component="fieldset" sx={[fieldsetStyles, sx.fieldset]}>
            <Typography component="legend" variant="caption" sx={sx.legend}>
                Открытие заявки:
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
                    options={companyOptions}
                    onChange={(value) => onSelectChange('repair_company', value)}
                    searchable
                    includeAll={false}
                    fullWidth
                />

                {showRentalContext && (
                    <>
                        <AppSelectField
                            id="repair-customer"
                            label="Контрагент"
                            value={form.customerId || ''}
                            options={customerOptions}
                            onChange={onCustomerChange}
                            searchable
                            includeAll={false}
                            fullWidth
                        />

                        <AppSelectField
                            id="repair-object"
                            label="Объект"
                            value={form.construction_object || ''}
                            options={objectOptions}
                            onChange={(value) => onSelectChange('construction_object', value)}
                            searchable
                            includeAll={false}
                            disabled={!form.customerId}
                            fullWidth
                        />

                        <AppSelectField
                            id="repair-rental-contract"
                            label="Договор аренды"
                            value={selectedContractId}
                            options={contractOptions}
                            onChange={(value) => onSelectChange('rental_contract', value)}
                            searchable
                            includeAll={false}
                            disabled={!form.customerId || (contractsLoading && !originalContract)}
                            fullWidth
                        />
                    </>
                )}
            </Box>

            {showRentalContext && contractError && (
                <Typography role="alert" variant="caption" color="error.main" sx={{ display: 'block', mt: 1, lineHeight: 1.4 }}>
                    {contractError}
                </Typography>
            )}

            {showRentalContext && form.customerId && contractsError && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1, lineHeight: 1.4 }}>
                    Не удалось загрузить договоры аренды. Повторите попытку позже.
                </Typography>
            )}
            {showRentalContext && form.customerId && !contractsLoading && !contractsError && customerContracts.length === 0 && !originalContract && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1, lineHeight: 1.4 }}>
                    Договоров аренды нет. Добавьте договор в карточке заказчика.
                </Typography>
            )}

            {isRegulatory && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Регламентный ремонт: без контрагента, объекта и договора аренды.
                </Typography>
            )}
            {contextWillBeCleared && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                    При сохранении связи с объектом и договором аренды будут удалены из заявки.
                </Typography>
            )}

            <Box sx={sx.filesSection}>
                <RepairFilesSection
                    title="Файлы открытия"
                    files={requestFiles}
                    onUpload={onUploadFile}
                    onDelete={onDeleteFile}
                    uploading={uploadingFile}
                    disabled={!requestId}
                />
            </Box>
        </Box>
    )
}
