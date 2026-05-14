import { Box, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material'

export default function PriceSection({ title = '', label, loading, prices, total, onChange }) {
    const typographySx = {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    }

    return (
        <>
            <Typography variant="h6" sx={{ mt: 0 }}>
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
                            <Typography variant="body2" sx={typographySx}>
                                {item.product?.name ?? item.product_name ?? '—'}
                            </Typography>

                            <TextField
                                size="small"
                                type="number"
                                value={item.current_display_price ?? ''}
                                onChange={(e) => onChange(item.id, e.target.value)}
                                sx={{ width: 120 }}
                            />
                        </Stack>
                    ))}
                </Stack>
            )}

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" sx={typographySx}>
                    ИТОГО:
                </Typography>

                <Typography variant="body2" sx={typographySx}>
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
