import { useLocation, useNavigate } from 'react-router-dom'

import { Box, CircularProgress, Divider, Grid, Typography } from '@mui/material'

import AppBreadcrumbs from './AppBreadcrumbs.jsx'
import ErrorState from './ui/ErrorState.jsx'
import AddAction from './ui/buttons/AddAction.jsx'

const sx = {
    page: {
        width: '100%',
        minWidth: 0,
        p: { xs: 1.5, sm: 2, md: 3 },
    },

    header: {
        p: { xs: 1.5, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
    },

    title: {
        m: 0,
        minWidth: 0,
        overflowWrap: 'anywhere',
    },

    divider: {
        mb: 3,
    },

    loading: {
        py: 6,
        display: 'flex',
        justifyContent: 'center',
    },

    list: {
        width: '100%',
        m: 0,
    },

    empty: {
        p: 2,
    },
}

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
    const location = useLocation()

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs />

            <Box sx={sx.header}>
                <Typography variant="h4" fontWeight={600} sx={sx.title}>
                    {title}
                </Typography>

                <AddAction onClick={() => navigate(addTo, { state: { from: location.pathname } })} />
            </Box>

            <Divider sx={sx.divider} />

            {error ? (
                <ErrorState error={error} onRetry={onRetry} loading={loading} />
            ) : loading ? (
                <Box sx={sx.loading}>
                    <CircularProgress />
                </Box>
            ) : items.length > 0 ? (
                <Grid container spacing={2} direction="column" sx={sx.list}>
                    {items.map((item, index) => (
                        <Grid size={12} key={item?.id ?? index}>
                            {renderRow(item)}
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography color="text.secondary" sx={sx.empty}>
                    {emptyText}
                </Typography>
            )}
        </Box>
    )
}

export default ObjectListView
