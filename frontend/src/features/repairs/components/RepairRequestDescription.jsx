import { Box, TextField } from '@mui/material'

import { repairRequestFormSx as sx } from '../RepairRequestForm.styles.js'

export default function RepairRequestDescription({ form, onChange }) {
    return (
        <Box sx={sx.description}>
            <TextField
                value={form.description || ''}
                onChange={onChange('description')}
                label="Описание"
                multiline
                fullWidth
                sx={sx.descriptionField}
            />

            {form.status === 'closed' && (
                <TextField
                    size="small"
                    label="Описание при закрытии"
                    value={form.closing_description || ''}
                    onChange={onChange('closing_description')}
                    multiline
                    rows={3}
                    fullWidth
                    sx={sx.closingDescription}
                />
            )}
        </Box>
    )
}
