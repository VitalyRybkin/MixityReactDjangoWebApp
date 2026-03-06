import React from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, Box, CircularProgress, Divider, Grid, Typography } from '@mui/material'

import AddAction from '../../components/ui/AddAction.jsx'

const ObjectListView = ({
    title,
    items = [],
    renderRow,
    loading = false,
    addTo,
    error = null,
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
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error?.response?.data?.detail || error?.message || 'Не удалось загрузить данные'}
                </Alert>
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
