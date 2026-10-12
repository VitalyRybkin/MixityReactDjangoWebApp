import { useMemo } from 'react'

import { Autocomplete, Box, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material'

import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

import { repairPartsListSx as sx } from './RepairSpecificationPartsList.styles.js'

export default function RepairSpecificationPartsList({ rows, partErrors = {}, partsList, onChange, onRemove }) {
    const selectedPartIds = useMemo(() => rows.map((row) => row.partId).filter(Boolean), [rows])

    return (
        <Stack spacing={1}>
            {rows.length === 0 && (
                <Typography color="text.secondary" sx={sx.emptyText}>
                    Добавьте запчасти.
                </Typography>
            )}

            {rows.map((row) => {
                const selectedPart = partsList.find((part) => part.id === row.partId) || null

                const rowErrors = partErrors[row.id] || {}

                return (
                    <Box key={row.id} sx={sx.row}>
                        <Box sx={sx.fields}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={partsList}
                                value={selectedPart}
                                getOptionLabel={(option) => option?.name || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                getOptionDisabled={(option) =>
                                    selectedPartIds.includes(option.id) && option.id !== row.partId
                                }
                                onChange={(_, newValue) =>
                                    onChange(row.id, {
                                        partId: newValue?.id || '',
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Запчасть"
                                        placeholder="Начните вводить название"
                                        error={Boolean(rowErrors.partId)}
                                        helperText={rowErrors.partId || ''}
                                    />
                                )}
                                sx={sx.partField}
                            />

                            <TextField
                                size="small"
                                label="Кол-во"
                                type="number"
                                required
                                value={row.quantity}
                                onChange={(e) =>
                                    onChange(row.id, {
                                        quantity: e.target.value,
                                    })
                                }
                                error={Boolean(rowErrors.quantity)}
                                helperText={rowErrors.quantity || ''}
                                slotProps={{
                                    htmlInput: {
                                        min: 0,
                                        step: 'any',
                                    },
                                }}
                                sx={sx.quantityField}
                            />

                            <TextField
                                size="small"
                                label="Цена"
                                type="number"
                                required
                                value={row.price_per_item}
                                onChange={(e) =>
                                    onChange(row.id, {
                                        price_per_item: e.target.value,
                                    })
                                }
                                error={Boolean(rowErrors.price_per_item)}
                                helperText={rowErrors.price_per_item || ''}
                                slotProps={{
                                    htmlInput: {
                                        min: 0,
                                        step: '0.01',
                                    },
                                }}
                                sx={sx.priceField}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={Boolean(row.is_rebillable)}
                                        onChange={(e) =>
                                            onChange(row.id, {
                                                is_rebillable: e.target.checked,
                                            })
                                        }
                                    />
                                }
                                label="Перевыставить"
                                sx={sx.rebillableField}
                            />

                            <Box sx={sx.deleteAction}>
                                <DeleteAction onClick={() => onRemove(row.id)} />
                            </Box>
                        </Box>
                    </Box>
                )
            })}
        </Stack>
    )
}
