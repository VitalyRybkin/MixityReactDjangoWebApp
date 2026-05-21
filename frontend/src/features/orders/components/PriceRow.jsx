import { InputAdornment, Stack, TextField, Typography } from '@mui/material'

import { useCurrencyField } from '../hooks/useCurrencyField.js'

export function PriceRow({ item, typographySx, onChange }) {
    const field = useCurrencyField(item.current_display_price, (v) => onChange(item.id, v))

    return (
        <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2" sx={typographySx}>
                {item.product?.name ?? item.product_name ?? '—'}
            </Typography>
            <TextField
                size="small"
                value={field.display}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                onFocus={field.handleFocus}
                sx={{ width: 120 }}
                slotProps={{
                    input: {
                        endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                    },
                }}
            />
        </Stack>
    )
}
