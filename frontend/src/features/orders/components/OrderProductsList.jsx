import { useMemo } from 'react'

import { Autocomplete, Box, Divider, Stack, TextField, Typography } from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

export default function OrderProductsList({ rows, productsList, onChange, onAdd, onRemove }) {
    const selectedIds = useMemo(() => rows.map((row) => row.productId).filter(Boolean), [rows])

    return (
        <>
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="h5" color="text.secondary">
                    Продукция
                </Typography>

                <Stack direction="row" spacing={1}>
                    <AddAction onClick={onAdd} />
                </Stack>
            </Box>

            <Divider sx={{ mb: 1 }} />

            <Stack spacing={1}>
                {rows.length === 0 && (
                    <Typography color="text.secondary" sx={{ px: 1 }}>
                        Добавьте продукцию.
                    </Typography>
                )}

                {rows.map((row) => {
                    const selectedProduct = productsList.find((product) => product.id === row.productId) || null

                    return (
                        <Box key={row.id} sx={{ p: 0.5 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={productsList}
                                    value={selectedProduct}
                                    getOptionLabel={(option) => option?.name || ''}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    getOptionDisabled={(option) =>
                                        selectedIds.includes(option.id) && option.id !== row.productId
                                    }
                                    onChange={(_, newValue) => onChange(row.id, 'productId', newValue?.id || '')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Продукция"
                                            placeholder="Начните вводить название"
                                        />
                                    )}
                                />

                                <TextField
                                    size="small"
                                    label="Количество"
                                    type="number"
                                    value={row.quantity}
                                    onChange={(e) => onChange(row.id, 'quantity', e.target.value)}
                                    sx={{ width: 200 }}
                                />

                                <TextField
                                    size="small"
                                    label="Тип упаковки"
                                    value={row.pack_type}
                                    onChange={(e) => onChange(row.id, 'pack_type', e.target.value)}
                                    sx={{ width: 480 }}
                                />

                                <DeleteAction onClick={() => onRemove(row.id)} />
                            </Stack>
                        </Box>
                    )
                })}
            </Stack>
        </>
    )
}
