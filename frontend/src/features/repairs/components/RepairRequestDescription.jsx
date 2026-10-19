import { Box, TextField } from '@mui/material'

import { repairRequestFormSx as sx } from '../RepairRequestForm.styles.js'

export default function RepairRequestDescription({ form, onChange }) {
    return (
        <Box sx={sx.descriptionColumn}>
            <TextField
                value={form.description || ''}
                onChange={onChange('description')}
                label="Описание"
                multiline
                fullWidth
                sx={sx.descriptionHalf}
            />

            <TextField
                value={form.closing_description || ''}
                onChange={onChange('closing_description')}
                label="Описание при закрытии"
                multiline
                fullWidth
                disabled={form.status !== 'closed'}
                sx={sx.descriptionHalf}
            />
        </Box>
    )
}
