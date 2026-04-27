import { useMemo } from 'react'

import { Box, Divider, Stack, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import { getProductColumns, localeText } from '../order.columns.jsx'

export default function OrderProductsGrid() {
    const columns = useMemo(() => getProductColumns(), [])

    return (
        <>
            <Box
                sx={{
                    p: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1,
                }}
            >
                <Typography variant="h5" color="text.secondary">
                    Продукция
                </Typography>

                <Stack direction="row" spacing={1}>
                    <AddAction />
                </Stack>
            </Box>

            <Divider sx={{ mb: 1 }} />

            <DataGrid columns={columns} rows={[]} localeText={{ ...localeText, noRowsLabel: 'Добавьте продукцию.' }} />
        </>
    )
}
