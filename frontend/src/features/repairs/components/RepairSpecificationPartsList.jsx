import {useMemo, useState} from 'react'

import {Autocomplete, Box, Checkbox, Divider, FormControlLabel, Stack, TextField, Typography} from '@mui/material'

import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

import { repairSpecificationListSx as sx } from './RepairSpecificationList.styles.js'
import AddAction from "../../../components/ui/buttons/AddAction.jsx";
import {useCreateSparePart} from "../utils/repair.parts.queries.js";
import RepairSpecificationItemCreateDialog from "./RepairSpecificationItemCreateDialog.jsx";

export default function RepairSpecificationPartsList({ rows, partErrors = {}, partsList, onChange, onRemove, totalPartsPrice, totalPartsPriceRebillable, }) {
    const selectedPartIds = useMemo(() => rows.map((row) => row.partId).filter(Boolean), [rows])
    const createPart = useCreateSparePart()
    const [createForRowId, setCreateForRowId] = useState(null)

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
                                sx={sx.itemField}
                            />

                            <AddAction
                                title="Добавить запчаcть"
                                onClick={() => setCreateForRowId(row.id)}
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

            <Divider />

            <Box sx={sx.totalFooter}>
                <Typography variant="h6">
                    Итого запчасти:
                </Typography>

                <Typography variant="h6" sx={sx.totalValue}>
                    {totalPartsPrice} руб.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    (в том числе клиенту: {totalPartsPriceRebillable} руб.)
                </Typography>
            </Box>

            <RepairSpecificationItemCreateDialog
                open={Boolean(createForRowId)}
                title="Добавить запчасть"
                label="Наименование запчасти"
                mutation={createPart}
                errorMessage="Не удалось добавить запчасть"
                onClose={() => setCreateForRowId(null)}
                onCreated={(created) => {
                    if (createForRowId) {
                        onChange(createForRowId, {
                            partId: created.id,
                        })
                    }

                    setCreateForRowId(null)
                }}
            />
        </Stack>

    )
}
