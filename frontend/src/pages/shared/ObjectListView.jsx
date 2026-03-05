import React from 'react'

import AddIcon from '@mui/icons-material/Add'
import { Alert, Box, CircularProgress, Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'

const ObjectListView = ({ title, items = [], renderRow, loading = false, error = null, emptyText = 'Список пуст' }) => {
    return (
        <Box sx={{ p: 3, width: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    {title}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Tooltip title="Добавить">
                    <span>
                        <IconButton
                            color="primary"
                            sx={{
                                border: '1px solid',
                                borderColor: 'primary.main',
                                backgroundColor: 'primary',
                                '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                                },
                            }}
                            onClick={() => navigate(editTo(id))}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

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
