import React from 'react'

import { Box, CircularProgress, Divider, Grid, Typography } from '@mui/material'

const UniversalListView = ({ title, items = [], renderRow, loading = false }) => {
    return (
        <Box sx={{ p: 3, width: '100%' }}>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                {title}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {loading ? (
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
                    Список пуст
                </Typography>
            )}
        </Box>
    )
}

export default UniversalListView
