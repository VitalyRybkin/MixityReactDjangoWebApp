import { Box, Stack, Typography } from '@mui/material'

import FormActions from '../../../components/ui/FormActions.jsx'

export default function OrderPageHeader({ isEdit, orderId, saving }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: {
                    xs: 'column',
                    sm: 'row',
                },
                alignItems: {
                    xs: 'stretch',
                    sm: 'center',
                },
                justifyContent: 'space-between',
                gap: 2,
                minWidth: 0,
                p: 3,
            }}
        >
            <Typography
                variant="h4"
                fontWeight={600}
                sx={{
                    minWidth: 0,
                    overflowWrap: 'anywhere',
                }}
            >
                {isEdit ? `Редактирование заявки № ${orderId}` : 'Новая заявка'}
            </Typography>

            <Stack direction="row" spacing={1}>
                <FormActions saving={saving} />
            </Stack>
        </Box>
    )
}
