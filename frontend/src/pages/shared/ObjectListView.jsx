import React from 'react'
import { useNavigate } from 'react-router-dom'

import { Box, CircularProgress, Divider, Grid, Typography } from '@mui/material'

import ErrorState from '../../components/ui/ErrorState.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'

const ObjectListView = ({
    title,
    items = [],
    renderRow,
    loading = false,
    addTo,
    error = null,
    onRetry,
    emptyText = 'Список пуст',
}) => {
    const navigate = useNavigate()

    return (
        <Box sx={{ p: 3, width: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    {title}
                </Typography>

                <AddAction onClick={() => navigate(addTo)} />
            </Box>
            <Divider sx={{ mb: 3 }} />

            {error ? (
                <ErrorState error={error} onRetry={onRetry} loading={loading} />
            ) : loading ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : items.length > 0 ? (
                <Grid container spacing={2} direction="column" sx={{ width: '100%', m: 0 }}>
                    {items.map((item, index) => (
                        <Grid size={12} key={item?.id ?? index}>
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
