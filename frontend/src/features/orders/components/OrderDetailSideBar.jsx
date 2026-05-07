import { useEffect, useState } from 'react'

import { Box, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material'

import AppSidebar from '../../..//layouts/AppSidebar.jsx'

export default function OrderDetailSideBar({
    open,
    setOpen,
    customerPrices = [],
    orderProducts = [],
    loadingCustomerPrices,
}) {
    const [editablePrices, setEditablePrices] = useState([])
    const [totalPrice, setTotalPrice] = useState(0)
    const [isCalculating, setIsCalculating] = useState(false)

    const getProductId = (item) => {
        if (!item) return null

        if (typeof item.product === 'object') {
            return item.product?.id
        }

        return item.product ?? item.product_id ?? item.productId
    }

    useEffect(() => {
        setEditablePrices(customerPrices)
    }, [customerPrices])

    useEffect(() => {
        setIsCalculating(true)

        const total = editablePrices.reduce((acc, item) => {
            const price = Number(item.sale_price) || 0
            const priceProductId = getProductId(item)

            const productRow = orderProducts.find((p) => Number(getProductId(p)) === Number(priceProductId))

            const qty = Number(productRow?.quantity) || 0

            return acc + price * qty
        }, 0)

        setTotalPrice(total)

        setIsCalculating(false)
    }, [editablePrices, orderProducts])

    const handlePriceChange = (id, value) => {
        setEditablePrices((prev) => prev.map((item) => (item.id === id ? { ...item, sale_price: value } : item)))
    }

    const typographySx = {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    }

    return (
        <AppSidebar open={open} setOpen={setOpen}>
            <Typography variant="h6" sx={{ mt: 3 }}>
                Данные заявки
            </Typography>

            <Divider sx={{ my: 1 }} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={typographySx}>
                    Наименование:
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={typographySx}>
                    Цена продажи:
                </Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            {loadingCustomerPrices ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <Stack spacing={1}>
                    {editablePrices.map((item) => (
                        <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={typographySx}>
                                {item.product.name}
                            </Typography>

                            <TextField
                                size="small"
                                type="number"
                                value={item.sale_price ?? ''}
                                onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                sx={{ width: 120 }}
                            />
                        </Stack>
                    ))}
                </Stack>
            )}

            <Divider sx={{ my: 1 }} />
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" sx={typographySx}>
                    ИТОГО:
                </Typography>

                {isCalculating ? (
                    <CircularProgress size={16} />
                ) : (
                    <Typography variant="body2" sx={typographySx}>
                        {totalPrice.toLocaleString('ru-RU')} руб.
                    </Typography>
                )}
            </Stack>
        </AppSidebar>
    )
}
