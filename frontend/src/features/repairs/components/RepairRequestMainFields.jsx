import { Box, TextField, Typography } from '@mui/material'

import AppSelectField from '../../../components/AppSelectField.jsx'
import { fieldsetStyles, repairRequestFormSx as sx } from '../RepairRequestForm.styles.js'
import { withCurrentRepairOption } from '../utils/repair.form.mappers.js'

import RepairFilesSection from './RepairFilesSection.jsx'

export default function RepairRequestMainFields({
    form,
    originalRequest,
    customers,
    customerObjects,
    repairCompanies,
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
            </Box>

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
