import { Box, Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { amountInCents, formatCents, previewTotals } from '../utils/additionalServices.logic.js'

const CATEGORIES = [
    { key: 'transport', title: 'Транспортные услуги / спецтехника' },
    { key: 'specialist', title: 'Услуги специалиста' },
]

export default function AdditionalServiceItems({ items, providerType, onChange, onAdd, onRemove, disabled }) {
    const totals = previewTotals(items)
    return (
        <Stack spacing={2}>
            {CATEGORIES.filter((group) => group.key === 'transport' || providerType === 'repair_company' || items.some((item) => item.category === 'specialist')).map((group) => {
                const rows = items.filter((item) => item.category === group.key)
                const totalsForGroup = totals.by_category[group.key]
                return (
                    <Box component="fieldset" key={group.key} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, minWidth: 0 }}>
                        <Typography component="legend" variant="subtitle1" sx={{ px: 1 }}>{group.title}</Typography>
                        <Stack spacing={1}>
                            {rows.length === 0 && <Typography color="text.secondary" variant="body2">Пока нет позиций.</Typography>}
                            {rows.map((item) => (
                                <Box key={item.localId} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(170px,2fr) 100px 140px 140px 150px 80px' }, gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        label="Наименование работы"
                                        value={item.name}
                                        onChange={(e) => onChange(item.localId, { name: e.target.value })}
                                        size="small" fullWidth disabled={disabled} required
                                    />
                                    <TextField
                                        label="Кол-во" type="number" size="small"
                                        value={item.quantity} disabled={disabled} required
                                        onChange={(e) => onChange(item.localId, { quantity: e.target.value })}
                                        slotProps={{ htmlInput: { min: '0.001', step: '0.001' } }}
                                    />
                                    <TextField
                                        label="Наши расходы/ед." type="number" size="small"
                                        value={item.cost_per_unit} disabled={disabled} required
                                        onChange={(e) => onChange(item.localId, { cost_per_unit: e.target.value })}
                                        slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
                                    />
                                    <TextField
                                        label="Заказчику/ед." type="number" size="small"
                                        value={item.price_per_unit} disabled={disabled} required
                                        onChange={(e) => onChange(item.localId, { price_per_unit: e.target.value })}
                                        slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
                                    />
                                    <Box>
                                        <FormControlLabel
                                            label="Перевыставить"
                                            control={<Checkbox checked={item.is_rebillable} disabled={disabled} onChange={(e) => onChange(item.localId, { is_rebillable: e.target.checked })} />}
                                        />
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {formatCents(amountInCents(item, 'cost_per_unit'))} / {formatCents(item.is_rebillable ? amountInCents(item, 'price_per_unit') : 0n)}
                                        </Typography>
                                    </Box>
                                    <Button size="small" color="error" disabled={disabled} onClick={() => onRemove(item.localId)}>Удалить</Button>
                                </Box>
                            ))}
                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={1}>
                                <Button size="small" variant="outlined" disabled={disabled || (group.key === 'specialist' && providerType === 'carrier')} onClick={() => onAdd(group.key)}>Добавить позицию</Button>
                                <Typography variant="body2">
                                    Расходы: {formatCents(totalsForGroup.cost)} · Заказчику: {formatCents(totalsForGroup.charge)} · Разница: {formatCents(totalsForGroup.margin)}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                )
            })}
        </Stack>
    )
}
