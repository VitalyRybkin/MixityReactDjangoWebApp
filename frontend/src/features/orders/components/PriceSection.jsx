import { Box, CircularProgress, Divider, Stack, Typography } from '@mui/material'

import { PriceRow } from './PriceRow.jsx'
import { priceSectionSx as sx } from './PriceSection.styles.js'

export default function PriceSection({ title = '', label, loading, prices, total, onChange }) {
    return (
        <>
            <Typography variant="h6" sx={sx.title}>
                {title}
            </Typography>

            <Divider sx={sx.divider} />

            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={sx.text}>
                    Наименование:
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={sx.text}>
                    {label}
                </Typography>
            </Stack>

            <Divider sx={sx.bottomDivider} />

            {loading ? (
                <Box sx={sx.loading}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <Stack spacing={1}>
                    {prices.map((item) => (
                        <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                            <PriceRow item={item} typographySx={sx.text} onChange={onChange} />
                        </Stack>
                    ))}
                </Stack>
            )}

            <Divider sx={sx.divider} />

            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" sx={sx.total}>
                    ИТОГО:
                </Typography>

                <Typography variant="body2" sx={sx.total}>
                    {total.toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{' '}
                    руб.
                </Typography>
            </Stack>
        </>
    )
}
