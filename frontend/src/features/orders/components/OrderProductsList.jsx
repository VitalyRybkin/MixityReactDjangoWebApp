import { useMemo } from 'react'

import { Autocomplete, Box, Divider, Stack, TextField, Typography } from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

import { orderProductsListSx as sx } from './OrderProductsList.styles.js'

export default function OrderProductsList({
                                              rows,
                                              productErrors = {},
                                              productsList,
                                              packsList,
                                              onChange,
                                              onAdd,
                                              onRemove,
                                          }) {
    const selectedProductIds = useMemo(
        () => rows.map((row) => row.productId).filter(Boolean),
        [rows],
    )

    return (
        <>
            <Box sx={sx.header}>
                <Typography variant="h5" color="text.secondary">
                    Продукция
                </Typography>

                <AddAction onClick={onAdd} />
            </Box>

            <Divider sx={sx.divider} />

            <Stack spacing={1}>
                {rows.length === 0 && (
                    <Typography color="text.secondary" sx={sx.emptyText}>
                        Добавьте продукцию.
                    </Typography>
                )}

                {rows.map((row) => {
                    const selectedProduct =
                        productsList.find(
                            (product) => product.id === row.productId,
                        ) || null

                    const selectedPack =
                        packsList.find(
                            (pack) => pack.id === row.packId,
                        ) || null

                    const unitTitle =
                        selectedProduct?.product_unit?.unit?.display_name || ''

                    const quantityError = Boolean(productErrors[row.id])
                    const isPieceBased = selectedProduct?.is_piece_based

                    return (
                        <Box key={row.id} sx={sx.row}>
                            <Box sx={sx.fields}>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={productsList}
                                    value={selectedProduct}
                                    getOptionLabel={(option) => option?.name || ''}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    getOptionDisabled={(option) =>
                                        selectedProductIds.includes(option.id) &&
                                        option.id !== row.productId
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

                                            if (isPieceBased) {
                                                if (/^\d*$/.test(value)) {
                                                    onChange(row.id, { quantity: value })
                                                }
                                            } else if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                onChange(row.id, { quantity: value })
                                            }
                                        }}
                                        error={quantityError}
                                        slotProps={{
                                            input: {
                                                inputProps: {
                                                    step: isPieceBased ? 1 : 0.01,
                                                    inputMode: isPieceBased ? 'numeric' : 'decimal',
                                                    min: isPieceBased ? 1 : 0.01,
                                                },
                                            },
                                        }}
                                        sx={sx.quantityField}
                                    />

                                    <Typography variant="body1" sx={sx.unit}>
                                        {unitTitle}
                                    </Typography>
                                </Box>

                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={packsList}
                                    value={selectedPack}
                                    getOptionLabel={(option) => option?.name || ''}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) =>
                                        onChange(row.id, {
                                            packId: newValue?.id || '',
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Тип упаковки"
                                            placeholder="Выберите упаковку"
                                        />
                                    )}
                                    sx={sx.packField}
                                />

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