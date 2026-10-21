import { Box, Typography } from '@mui/material'

import { filteriSummarySx as sx } from '../styles/filterSummary.styles.js'

import FilterDateRange from './FilterDateRange.jsx'

export default function FilterSummary({ dateStr, items = [], leading = null, trailing = null }) {
    return (
        <Box sx={sx.filterSummary}>
            {leading}

            <FilterDateRange dateStr={dateStr} />

            {items.map(({ key, label, value }) => (
                <Box key={key} sx={sx.filterSummaryItem}>
                    <Typography variant="body1" sx={sx.filterSummaryLabel}>
                        {label}:
                    </Typography>

                    <Typography variant="body1" sx={sx.filterSummaryValue}>
                        {value || '-'}
                    </Typography>
                </Box>
            ))}

            {trailing && <Box sx={sx.filterSummaryActions}>{trailing}</Box>}
        </Box>
    )
}
