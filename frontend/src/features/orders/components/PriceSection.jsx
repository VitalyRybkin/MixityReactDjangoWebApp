import { Box, CircularProgress, Divider, Stack, Typography } from '@mui/material'

import { PriceRow } from './PriceRow.jsx'

export default function PriceSection({ title = '', label, loading, prices, total, onChange }) {
    const typographySx = {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    }

    const totalSx = {
        ...typographySx,
        color: 'primary.main',
    }

    return (
        <>
            <Typography variant="h6" sx={{ mt: 0, color: 'primary.main' }}>
                {title}
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={typographySx}>
                    Наименование:
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={typographySx}>
                    {label}
                </Typography>
            </Stack>

            <Divider sx={{ mb: 1 }} />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <Stack spacing={1}>
                    {prices.map((item) => (
                        <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                            <PriceRow key={item.id} item={item} typographySx={typographySx} onChange={onChange} />
                        </Stack>
                    ))}
                </Stack>
            )}

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" sx={totalSx}>
                    ИТОГО:
                </Typography>

                <Typography variant="body2" sx={totalSx}>
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
