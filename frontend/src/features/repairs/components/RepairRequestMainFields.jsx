import { Box, TextField, Typography } from '@mui/material'

import AppSelectField from '../../../components/AppSelectField.jsx'
import FileUploadAction from '../../../components/FileUploadAction.jsx'
import { fieldsetStyles, repairRequestFormSx as sx } from '../RepairRequestForm.styles.js'

export default function RepairRequestMainFields({
    form,
    customers,
    customerObjects,
    repairCompanies,
    onChange,
    onSelectChange,
    onCustomerChange,
}) {
    return (
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
                    onChange={(value) => onSelectChange('repair_company', value)}
                    searchable
                    includeAll={false}
                    fullWidth
                />

                <AppSelectField
                    id="repair-customer"
                    label="Контрагент"
                    value={form.customerId || ''}
                    options={customers}
                    onChange={onCustomerChange}
                    searchable
                    includeAll={false}
                    fullWidth
                />

                <AppSelectField
                    id="repair-object"
                    label="Объект"
                    value={form.construction_object || ''}
                    options={customerObjects}
                    onChange={(value) => onSelectChange('construction_object', value)}
                    searchable
                    includeAll={false}
                    disabled={!form.customerId}
                    fullWidth
                />
            </Box>

            <Box sx={sx.filesSection}>
                <Typography variant="caption" sx={sx.filesTitle}>
                    Файлы:
                </Typography>

                <FileUploadAction />
            </Box>
        </Box>
    )
}
