import { useMemo } from 'react'

import { Autocomplete, Box, Divider, Stack, TextField, Typography } from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

import { repairPartsListSx as sx } from './RepairSpecificationPartsList.styles.js'

export default function RepairSpecificationPartsList({ rows, partErrors = {}, partsList, onChange, onAdd, onRemove }) {
    const selectedPartIds = useMemo(() => rows.map((row) => row.partId).filter(Boolean), [rows])
    return (
        <>
            <Box sx={sx.header}>
                <Typography variant="h5" color="text.secondary">
                    Запчасти
                </Typography>

                <AddAction onClick={onAdd} />
            </Box>

            <Divider sx={sx.divider} />

            <Stack spacing={1}>
                {rows.length === 0 && (
                    <Typography color="text.secondary" sx={sx.emptyText}>
                        Добавьте запчасти.
                    </Typography>
                )}

                {rows.map((row) => {
                    const selectedPart = partsList.find((part) => part.id === row.partId) || null
                    const quantityError = Boolean(partErrors[row.id])

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
                                    onChange={(_, newValue) => {
                                        onChange(row.id, {
                                            partId: newValue?.id || '',
                                        })
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Запчасти"
                                            placeholder="Начните вводить название"
                                        />
                                    )}
                                    sx={sx.productField}
                                />

                                <Box sx={sx.quantityGroup}>
                                    <TextField
                                        size="small"
                                        label="Количество"
                                        type="number"
                                        required
                                        value={row.quantity}
                                        onChange={(e) => {
                                            const value = e.target.value

                                            if (value === '') {
                                                onChange(row.id, { quantity: '' })
                                                return
                                            }

                                            // if (isPieceBased) {
                                            //     if (/^\d*$/.test(value)) {
                                            //         onChange(row.id, { quantity: value })
                                            //     }
                                            // } else if (/^\d*\.?\d{0,2}$/.test(value)) {
                                            //     onChange(row.id, { quantity: value })
                                            // }
                                        }}
                                        error={quantityError}
                                        // slotProps={{
                                        //     input: {
                                        //         inputProps: {
                                        //             step: isPieceBased ? 1 : 0.01,
                                        //             inputMode: isPieceBased ? 'numeric' : 'decimal',
                                        //             min: isPieceBased ? 1 : 0.01,
                                        //         },
                                        //     },
                                        // }}
                                        sx={sx.quantityField}
                                    />

                                    {/*<Typography variant="body1" sx={sx.unit}>*/}
                                    {/*    {unitTitle}*/}
                                    {/*</Typography>*/}
                                </Box>

                                {/*<Autocomplete*/}
                                {/*    fullWidth*/}
                                {/*    size="small"*/}
                                {/*    options={packsList}*/}
                                {/*    value={selectedPack}*/}
                                {/*    getOptionLabel={(option) => option?.name || ''}*/}
                                {/*    isOptionEqualToValue={(option, value) => option.id === value.id}*/}
                                {/*    onChange={(_, newValue) =>*/}
                                {/*        onChange(row.id, {*/}
                                {/*            packId: newValue?.id || '',*/}
                                {/*        })*/}
                                {/*    }*/}
                                {/*    renderInput={(params) => (*/}
                                {/*        <TextField {...params} label="Тип упаковки" placeholder="Выберите упаковку" />*/}
                                {/*    )}*/}
                                {/*    sx={sx.packField}*/}
                                {/*/>*/}

                                <Box sx={sx.deleteAction}>
                                    <DeleteAction onClick={() => onRemove(row.id)} />
                                </Box>
                            </Box>
                        </Box>
                    )
                })}
            </Stack>
        </>
    )
}
