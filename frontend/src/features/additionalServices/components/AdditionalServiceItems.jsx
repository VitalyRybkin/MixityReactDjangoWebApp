import { Box, Checkbox, Divider, FormControlLabel, Stack, TextField, Typography } from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'
import { repairRequestFormSx as sx } from '../../repairs/RepairRequestForm.styles.js'
import { formatCents, previewTotals } from '../utils/additionalServices.logic.js'

const CATEGORIES = [
    { key: 'transport', title: 'ТРАНСПОРТ / СПЕЦТЕХНИКА', footer: 'Итого транспорт' },
    { key: 'specialist', title: 'УСЛУГИ СПЕЦИАЛИСТА', footer: 'Итого специалист' },
]

const sectionSx = {
    ...sx.specificationSection,
    mt: 2,
    minWidth: 0,
}

const headerSx = {
    ...sx.specificationHeader,
    alignItems: 'center',
    gap: 2,
    mb: 1,
}

const rowSx = {
    py: 1.5,
    borderBottom: '1px solid',
    borderColor: 'divider',
    minWidth: 0,
}

const fieldsSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        sm: 'minmax(0, 1fr) minmax(100px, 140px)',
        lg: 'minmax(190px, 2.2fr) minmax(90px, .65fr) minmax(135px, 1fr) minmax(135px, 1fr) minmax(155px, 1fr) auto',
    },
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
}

export default function AdditionalServiceItems({ items, providerType, onChange, onAdd, onRemove, disabled }) {
    const totals = previewTotals(items)

    return (
        <>
            {CATEGORIES.filter(
                (group) => group.key === 'transport'
                    || providerType === 'repair_company'
                    || items.some((item) => item.category === 'specialist'),
            ).map((group) => {
                const rows = items.filter((item) => item.category === group.key)
                const groupTotals = totals.by_category[group.key]
                const canAdd = !disabled && !(group.key === 'specialist' && providerType === 'carrier')

                return (
                    <Box key={group.key} sx={sectionSx}>
                        <Stack direction="row" sx={headerSx}>
                            <Typography variant="h6" sx={sx.specificationGrandTotalValue}>
                                {group.title}
                            </Typography>
                            {!disabled && (
                                <AddAction
                                    title="Добавить позицию"
                                    onClick={() => onAdd(group.key)}
                                    disabled={!canAdd}
                                />
                            )}
                        </Stack>

                        <Divider sx={sx.divider} />

                        {rows.length === 0 && (
                            <Typography color="text.secondary" sx={{ py: 2 }}>
                                Добавьте позицию.
                            </Typography>
                        )}

                        {rows.map((item) => (
                            <Box key={item.localId} sx={rowSx}>
                                <Box sx={fieldsSx}>
                                    <TextField
                                        label="Наименование работы"
                                        size="small"
                                        value={item.name}
                                        onChange={(event) => onChange(item.localId, { name: event.target.value })}
                                        disabled={disabled}
                                        required
                                        fullWidth
                                    />

                                    <TextField
                                        label="Кол-во"
                                        type="number"
                                        size="small"
                                        value={item.quantity}
                                        onChange={(event) => onChange(item.localId, { quantity: event.target.value })}
                                        slotProps={{ htmlInput: { min: '0.001', step: '0.001' } }}
                                        disabled={disabled}
                                        required
                                        fullWidth
                                    />

                                    <TextField
                                        label="Наши расходы/ед."
                                        type="number"
                                        size="small"
                                        value={item.cost_per_unit}
                                        onChange={(event) => onChange(item.localId, { cost_per_unit: event.target.value })}
                                        slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
                                        disabled={disabled}
                                        required
                                        fullWidth
                                    />

                                    <TextField
                                        label="Заказчику/ед."
                                        type="number"
                                        size="small"
                                        value={item.price_per_unit}
                                        onChange={(event) => onChange(item.localId, { price_per_unit: event.target.value })}
                                        slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
                                        disabled={disabled}
                                        required
                                        fullWidth
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={Boolean(item.is_rebillable)}
                                                disabled={disabled}
                                                onChange={(event) => onChange(item.localId, { is_rebillable: event.target.checked })}
                                            />
                                        }
                                        label="Перевыставить"
                                        sx={{ m: 0 }}
                                    />

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        {!disabled && (
                                            <DeleteAction onClick={() => onRemove(item.localId)} />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ))}

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1}
                            sx={{ py: 2 }}
                        >
                            <Typography variant="h6">
                                {group.footer} (расходы):
                            </Typography>
                            <Typography variant="h6" sx={sx.specificationGrandTotalValue}>
                                {formatCents(groupTotals.cost)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Заказчику: {formatCents(groupTotals.charge)}
                            </Typography>
                        </Stack>
                    </Box>
                )
            })}
        </>
    )
}
