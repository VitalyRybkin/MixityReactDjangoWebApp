import { Link as RouterLink } from 'react-router-dom'

import { Box, Button, Container, Paper, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

const sx = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },

    card: (theme) => ({
        p: { xs: 4, md: 6 },
        textAlign: 'center',
        borderRadius: 4,
        backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.7 : 0.85),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        boxShadow: theme.shadows[10],
    }),

    code: (theme) => ({
        fontWeight: 800,
        fontSize: { xs: '4.5rem', md: '6rem' },
        letterSpacing: -2,
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    }),

    description: {
        mt: 2,
        mb: 4,
    },

    button: {
        px: 4,
        py: 1.5,
        borderRadius: 3,
        fontWeight: 600,
        textTransform: 'none',
    },
}

const NotFound = () => {
    return (
        <Box sx={sx.page}>
            <Container maxWidth="sm">
                <Paper elevation={0} sx={sx.card}>
                    <Typography variant="h1" sx={sx.code}>
                        404
                    </Typography>

                    <Typography variant="h4">Страница не найдена.</Typography>

                    <Typography variant="body1" color="text.secondary" sx={sx.description}>
                        Страница, которую вы ищете, не существует или была перемещена.
                    </Typography>

                    <Button variant="contained" size="large" component={RouterLink} to="/" sx={sx.button}>
                        На главную
                    </Button>
                </Paper>
            </Container>
        </Box>
    )
}

export default NotFound
