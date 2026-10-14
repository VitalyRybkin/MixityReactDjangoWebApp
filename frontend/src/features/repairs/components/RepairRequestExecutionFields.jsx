import { Box, TextField, Typography } from '@mui/material'

import AppSelectField from '../../../components/AppSelectField.jsx'
import { fieldsetStyles, repairRequestFormSx as sx } from '../RepairRequestForm.styles.js'
import { locationOptions, statusOptions } from '../utils/request.form.constants.js'

import RepairFilesSection from './RepairFilesSection.jsx'

const toSelectOptions = (options) =>
    Object.entries(options).map(([id, name]) => ({
        id,
        name,
    }))

export default function RepairRequestExecutionFields({
    form,
    onChange,
    onSelectChange,

    requestId,
    closingFiles,
    onUploadFile,
    onDeleteFile,
    uploadingFile,
}) {
    return (
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
                    onChange={(value) => onSelectChange('status', value)}
                    includeAll={false}
                    fullWidth
                />

                <AppSelectField
                    id="repair-location"
                    label="Место выполнения"
                    value={form.location}
                    options={toSelectOptions(locationOptions)}
                    onChange={(value) => onSelectChange('location', value)}
                    includeAll={false}
                    fullWidth
                />
            </Box>

            <Box sx={sx.filesSection}>
                <RepairFilesSection
                    title="Файлы закрытия"
                    files={closingFiles}
                    onUpload={onUploadFile}
                    onDelete={onDeleteFile}
                    uploading={uploadingFile}
                    disabled={!requestId}
                />
            </Box>
        </Box>
    )
}
