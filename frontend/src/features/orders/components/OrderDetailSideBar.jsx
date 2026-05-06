import { useEffect, useState } from 'react'

import { Divider, Stack, TextField, Typography } from '@mui/material'

import AppSidebar from '../../..//layouts/AppSidebar.jsx'

export default function OrderDetailSideBar({ open, setOpen, customerPrices = [] }) {
    const [editablePrices, setEditablePrices] = useState([])

    useEffect(() => {
        setEditablePrices(customerPrices)
    }, [customerPrices])

    const handlePriceChange = (id, value) => {
        setEditablePrices((prev) => prev.map((item) => (item.id === id ? { ...item, sale_price: value } : item)))
    }

    return (
        <AppSidebar open={open} setOpen={setOpen}>
            <Typography variant="h6" sx={{ mt: 3 }}>
                Данные заявки
            </Typography>

            <Divider sx={{ my: 2, mb: 1 }} />

            <Stack spacing={1}>
                {editablePrices.map((item) => (
                    <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {item.product.name}
                        </Typography>

                        <TextField
                            size="small"
                            label="Стоимость"
                            type="number"
                            value={item.sale_price ?? ''}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            sx={{
                                width: 120,
                                flexShrink: 0,
                            }}
                        />
                    </Stack>
                ))}
            </Stack>

            <Divider sx={{ my: 2 }} />
        </AppSidebar>
    )
}
