import React, { useMemo, useState } from 'react'

import ClearIcon from '@mui/icons-material/Clear'
import { Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material'

import { catalogProductSx as sx } from './CatalogProduct.styles.js'

export default function PriceSidebar({ customers, warehouses, selection, onSelect }) {
    const [search, setSearch] = useState('')

    const filteredCustomers = useMemo(() => {
        const value = search.trim().toLowerCase()

        if (!value) {
            return customers
        }

        return customers.filter((customer) => customer.name.toLowerCase().includes(value))
    }, [customers, search])

    return (
        <Box sx={sx.sidebar}>
            <Box sx={sx.sidebarSection}>
                <Typography variant="h6" sx={sx.sidebarTitle}>
                    Цены продажи
                </Typography>

                <TextField
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Поиск покупателя"
                    size="small"
                    fullWidth
                    sx={sx.search}
                    slotProps={{
                        input: {
                            endAdornment: search ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearch('')} edge="end">
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        },
                    }}
                />

                <Box sx={sx.entityList}>
                    {filteredCustomers.map((customer) => {
                        const selected = selection?.type === 'sale' && selection.entity.id === customer.id

                        return (
                            <Button
                                key={customer.id}
                                onClick={() =>
                                    onSelect({
                                        type: 'sale',
                                        entity: customer,
                                    })
                                }
                                sx={[sx.entityButton, selected && sx.entityButtonSelected]}
                            >
                                {customer.name}
                            </Button>
                        )
                    })}
                </Box>

                {filteredCustomers.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={sx.noResults}>
                        Поставщики не найдены
                    </Typography>
                )}
            </Box>

            <Box sx={sx.sidebarSection}>
                <Typography variant="h6" sx={sx.sidebarTitle}>
                    Закупочные цены
                </Typography>

                <Box sx={sx.entityList}>
                    {warehouses.map((warehouse) => {
                        const selected = selection?.type === 'purchase' && selection.entity.id === warehouse.id

                        return (
                            <Button
                                key={warehouse.id}
                                onClick={() =>
                                    onSelect({
                                        type: 'purchase',
                                        entity: warehouse,
                                    })
                                }
                                sx={[sx.entityButton, selected && sx.entityButtonSelected]}
                            >
                                {warehouse.name}
                            </Button>
                        )
                    })}
                </Box>
            </Box>
        </Box>
    )
}
