import { Box, Stack, Typography } from '@mui/material'

import FormActions from '../../../components/ui/FormActions.jsx'

export default function OrderPageHeader({ isEdit, orderId, saving, onCancel }) {
    return (
        <Box
            sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <Typography
                variant="h4"
                color="text.secondary"
                sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}
                gutterBottom
                fontWeight={600}
            >
                {isEdit ? `РЕДАКТИРОВАНИЕ ЗАЯВКИ № ${orderId || ''}` : 'СОЗДАНИЕ ЗАЯВКИ'}
            </Typography>

            <Stack direction="row" spacing={1}>
                <FormActions saving={saving} onCancel={onCancel} />
            </Stack>
        </Box>
    )
}
