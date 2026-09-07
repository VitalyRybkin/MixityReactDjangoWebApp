import { Box, Typography } from '@mui/material'

import { commonLayoutSx } from '../styles/layout.styles.js'

export default function PageHeader({ title, actions }) {
    return (
        <Box sx={commonLayoutSx.header}>
            <Typography variant="h4" fontWeight={600}>
                {title}
            </Typography>

            {actions && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        ml: {
                            xs: 0,
                            sm: 'auto',
                        },
                    }}
                >
                    {actions}
                </Box>
            )}
        </Box>
    )
}
