import { useEffect, useState } from 'react'

import { Autocomplete, Box, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material'

import AppSidebar from '../../..//layouts/AppSidebar.jsx'

export default function OrderDetailSideBar({
    open,
    setOpen,
    customerPrices = [],
    loadingCustomerPrices,
    warehousePrices = [],
    loadingWarehousePrices,
    orderProducts = [],
    setOrderProducts,
    orderDelivery,
    setOrderDelivery,
    orderResources,
}) {
    const [editableSalePrices, setEditableSalePrices] = useState([])
    const [editablePurchasePrices, setEditablePurchasePrices] = useState([])
    const [totalSalePrice, setTotalSalePrice] = useState(0)
    const [totalPurchasePrice, setTotalPurchasePrice] = useState(0)
    const [isCalculating, setIsCalculating] = useState(false)
    const warehouses = orderResources?.warehouses ?? []

    const getProductId = (item) => {
        if (!item) return null

        if (typeof item.product === 'object') {
            return item.product?.id
        }

        return item.product ?? item.product_id ?? item.productId
    }

    useEffect(() => {
        setEditableSalePrices(customerPrices)
    }, [customerPrices])

    useEffect(() => {
        setEditablePurchasePrices(warehousePrices)
    }, [warehousePrices])

    useEffect(() => {
        setIsCalculating(true)

        const totalAtSale = orderProducts.reduce((acc, item) => {
            const price = Number(item.price_at_sale) || 0
            const qty = Number(item.quantity) || 0

            return acc + price * qty
        }, 0)

        setTotalSalePrice(totalAtSale)

        const totalAtPurchase = orderProducts.reduce((acc, item) => {
            const price = Number(item.price_at_purchase) || 0
            const qty = Number(item.quantity) || 0

            return acc + price * qty
        }, 0)

        setTotalPurchasePrice(totalAtPurchase)

        setIsCalculating(false)
    }, [orderProducts])

    useEffect(() => {
        if (customerPrices.length > 0 && orderProducts.length > 0) {
            const initializedPrices = customerPrices.map((cp) => {
                const productId = getProductId(cp)
                const productInOrder = orderProducts.find((op) => Number(getProductId(op)) === Number(productId))

                const actualPrice =
                    productInOrder && productInOrder.price_at_sale != null
                        ? productInOrder.price_at_sale
                        : cp.sale_price

                return { ...cp, current_display_price: actualPrice }
            })

            setEditableSalePrices(initializedPrices)

            setOrderProducts((prev) => {
                let hasChanges = false
                const newOrderProducts = prev.map((product) => {
                    const productId = getProductId(product)
                    const priceInfo = customerPrices.find((cp) => Number(getProductId(cp)) === Number(productId))

                    if (priceInfo && !product.price_at_sale) {
                        hasChanges = true
                        return { ...product, price_at_sale: priceInfo.sale_price }
                    }
                    return product
                })

                return hasChanges ? newOrderProducts : prev
            })
        }
    }, [customerPrices, orderProducts.length])

    const handlePriceAtSaleChange = (id, value) => {
        const numericValue = value === '' ? 0 : parseFloat(value)

        setEditableSalePrices((prev) =>
            prev.map((item) => (item.id === id ? { ...item, current_display_price: value } : item)),
        )

        const targetPriceItem = editableSalePrices.find((p) => p.id === id)
        const productId = getProductId(targetPriceItem)

        setOrderProducts((prev) =>
            prev.map((item) => {
                const itemProductId = getProductId(item)

                if (Number(itemProductId) === Number(productId)) {
                    return { ...item, price_at_sale: numericValue }
                }
                return item
            }),
        )
    }

    const handleWarehousePriceAtSaleChange = (id, value) => {
        const numericValue = value === '' ? 0 : parseFloat(value)

        setEditablePurchasePrices((prev) =>
            prev.map((item) => (item.id === id ? { ...item, current_display_price: value } : item)),
        )

        const targetPriceItem = editablePurchasePrices.find((p) => p.id === id)
        const productId = getProductId(targetPriceItem)

        setOrderProducts((prev) =>
            prev.map((item) => {
                const itemProductId = getProductId(item)

                if (Number(itemProductId) === Number(productId)) {
                    return { ...item, price_at_sale: numericValue }
                }
                return item
            }),
        )
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
                ПРОДАЖА
            </Typography>

            <Divider sx={{ my: 1 }} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 0 }}>
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
                    {editableSalePrices.map((item) => (
                        <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={typographySx}>
                                {item.product.name}
                            </Typography>

                            <TextField
                                size="small"
                                type="number"
                                value={item.current_display_price ?? ''}
                                onChange={(e) => handlePriceAtSaleChange(item.id, e.target.value)}
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
                        {totalSalePrice.toLocaleString('ru-RU')} руб.
                    </Typography>
                )}
            </Stack>

            <Typography variant="h6" sx={{ mt: 3 }}>
                ЗАКУПКА
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Autocomplete
                size="small"
                options={warehouses}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={orderDelivery?.warehouse ?? null}
                onChange={(event, newValue) => {
                    setOrderDelivery((prev) => ({
                        ...prev,
                        warehouse: newValue,
                    }))
                }}
                renderInput={(params) => <TextField {...params} label="Склад" />}
                sx={{ mt: 1 }}
            />

            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={typographySx}>
                    Наименование:
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={typographySx}>
                    Цена закупки:
                </Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            {loadingWarehousePrices ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <Stack spacing={1}>
                    {editablePurchasePrices.map((item) => (
                        <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={typographySx}>
                                {item.product.name}
                            </Typography>

                            <TextField
                                size="small"
                                type="number"
                                value={item.current_display_price ?? ''}
                                onChange={(e) => handleWarehousePriceAtSaleChange(item.id, e.target.value)}
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
                        {totalSalePrice.toLocaleString('ru-RU')} руб.
                    </Typography>
                )}
            </Stack>
        </AppSidebar>
    )
}
