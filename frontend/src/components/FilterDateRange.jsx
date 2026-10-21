import React from 'react'

import { Box, Typography } from '@mui/material'

import { filteriSummarySx as sx } from '../styles/filterSummary.styles.js'

export default function FilterDateRange({ dateStr }) {
    return (
        <Box sx={sx.filterSummaryItem}>
            <Typography variant="body1" sx={sx.filterSummaryLabel}>
                Период:
            </Typography>

            <Typography variant="body1" sx={sx.filterSummaryValue}>
                {dateStr}
            </Typography>
        </Box>
    )
}
