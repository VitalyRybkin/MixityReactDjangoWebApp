import { Stack, TextField, Typography } from '@mui/material'

import { useCurrencyField } from '../hooks/useCurrencyField.js'
import { normalizeOrderPrice } from '../utils/orderPrices.js'

export function PriceRow({ item, typographySx, onChange, readOnly = false }) {
    const field = useCurrencyField(item.current_display_price, (v) => onChange(item.id, v))

    return (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Typography
                variant="body2"
                sx={{
                    ...typographySx,
                    flex: 1,
                    minWidth: 0,
                }}
            >
                {item.product?.name ?? item.product_name ?? '—'}
            </Typography>

            <TextField
                size="small"
                value={field.display}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                onFocus={field.handleFocus}
                error={!readOnly && normalizeOrderPrice(item.current_display_price) === null}
                helperText={!readOnly && normalizeOrderPrice(item.current_display_price) === null ? 'Укажите цену' : ''}
                disabled={readOnly}
                sx={{
                    width: 120,
                    flexShrink: 0,
                    '& input': {
                        textAlign: 'right',
                    },
                }}
            />
        </Stack>
    )
}
