import { useMemo } from 'react'

import { Autocomplete, Box, Divider, Stack, TextField, Typography } from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

export default function OrderProductsList({ rows, productsList, packsList, onChange, onAdd, onRemove }) {
    const selectedProductIds = useMemo(() => rows.map((row) => row.productId).filter(Boolean), [rows])

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
                    const selectedPack = packsList.find((pack) => pack.id === row.packId) || null
                    const unitTitle = selectedProduct?.product_unit?.unit?.display_name || ''

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
                                        selectedProductIds.includes(option.id) && option.id !== row.productId
                                    }
                                    onChange={(_, newValue) => {
                                        onChange(row.id, {
                                            productId: newValue?.id || '',
                                            packId: newValue?.default_package?.id || '',
                                        })
                                    }}
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
                                    onChange={(e) => {
                                        let value = e.target.value
                                        if (value === '') {
                                            onChange(row.id, { quantity: '' })
                                            return
                                        }
                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                            onChange(row.id, { quantity: value })
                                        }
                                    }}
                                    inputProps={{
                                        step: '0.01',
                                        inputMode: 'decimal',
                                    }}
                                    sx={{ width: 300 }}
                                />
                                <Typography variant="body1" color="text.secondary" sx={{ px: 0, width: 70 }}>
                                    {unitTitle}
                                </Typography>

                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={packsList}
                                    value={selectedPack}
                                    getOptionLabel={(option) => option?.name || ''}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => onChange(row.id, { packId: newValue?.id || '' })}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Тип упаковки" placeholder="Выберите упаковку" />
                                    )}
                                    sx={{ width: 700 }}
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
