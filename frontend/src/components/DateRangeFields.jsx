import { Box, TextField } from '@mui/material'

const dateFieldProps = {
    fullWidth: true,
    size: 'small',
    margin: 'normal',
    slotProps: {
        inputLabel: { shrink: true },
    },
}

export default function DateRangeFields({
                                            filters,
                                            onChange,
                                            fromField = 'dateFrom',
                                            toField = 'dateTo',
                                            fromId = 'date-from',
                                            toId = 'date-to',
                                            fromLabel = 'С:',
                                            toLabel = 'По:',
                                            sx,
                                        }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', ...sx }}>
            <TextField
                id={fromId}
                name={fromField}
                label={fromLabel}
                type="date"
                value={filters?.[fromField] ?? ''}
                onChange={(event) => onChange(fromField, event.target.value)}
                {...dateFieldProps}
            />

            <TextField
                id={toId}
                name={toField}
                label={toLabel}
                type="date"
                value={filters?.[toField] ?? ''}
                onChange={(event) => onChange(toField, event.target.value)}
                {...dateFieldProps}
            />
        </Box>
    )
}