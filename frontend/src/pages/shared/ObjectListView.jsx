import React from 'react'

import { Alert, Box, CircularProgress, Divider, Grid, Typography } from '@mui/material'

const ObjectListView = ({
    title,
    items = [],
    renderRow,
    loading = false,
    error = null,
    emptyText = 'Список пуст',
}) => {
    return (
        <Box sx={{ p: 3, width: '100%' }}>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                {title}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {error ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Не удалось загрузить данные
                </Alert>
            ) : loading ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : items.length > 0 ? (
                <Grid container spacing={2} direction="column" sx={{ width: '100%', m: 0 }}>
                    {items.map((item, index) => (
                        <Grid item xs={12} key={item?.id ?? index}>
                            {renderRow(item)}
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography color="text.secondary" sx={{ p: 2 }}>
                    {emptyText}
                </Typography>
            )}
        </Box>
    )
}

export default ObjectListView
