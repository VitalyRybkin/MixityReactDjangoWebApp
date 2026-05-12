import { useEffect, useMemo, useState } from 'react'

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
    orderResources,
    form,
    setForm,
}) {
    const [editableSalePrices, setEditableSalePrices] = useState([])
    const [editablePurchasePrices, setEditablePurchasePrices] = useState([])

    const warehouses = orderResources?.warehouses ?? []
    const products = orderResources?.products ?? []

    const getProductId = (item) => {
        if (!item) return null

        if (typeof item.product === 'object') {
            return item.product?.id
        }

        if (typeof item.productId === 'object') {
            return item.productId?.id
        }

        if (typeof item.product_id === 'object') {
            return item.product_id?.id
        }

        return item.product ?? item.product_id ?? item.productId ?? null
    }

    const getProductObject = (item, prices = []) => {
        if (!item) return null

        if (typeof item.product === 'object') {
            return item.product
        }

        if (typeof item.productId === 'object') {
            return item.productId
        }

        if (typeof item.product_id === 'object') {
            return item.product_id
        }

        const productId = getProductId(item)

        return (
            prices.find((price) => Number(getProductId(price)) === Number(productId))?.product ??
            products.find((product) => Number(product.id) === Number(productId)) ??
            null
        )
    }

    const warehouseId = form?.warehouse?.id ?? form?.warehouse ?? null
    const customerId = form?.customer?.id ?? form?.customer ?? null

    const productIdsKey = useMemo(() => {
        return orderProducts.map(getProductId).filter(Boolean).map(String).sort().join(',')
    }, [orderProducts])

    const totalSalePrice = useMemo(() => {
        return orderProducts.reduce((acc, item) => {
            const price = Number(item.price_at_sale) || 0
            const qty = Number(item.quantity) || 0

            return acc + price * qty
        }, 0)
    }, [orderProducts])

    const totalPurchasePrice = useMemo(() => {
        return orderProducts.reduce((acc, item) => {
            const price = Number(item.price_at_purchase) || 0
            const qty = Number(item.quantity) || 0

            return acc + price * qty
        }, 0)
    }, [orderProducts])

    useEffect(() => {
        if (orderProducts.length === 0) {
            setEditableSalePrices([])
            return
        }

        const rows = orderProducts.map((productRow) => {
            const productId = getProductId(productRow)
            const priceInfo = customerPrices.find((cp) => Number(getProductId(cp)) === Number(productId))
            const productObject = getProductObject(productRow, customerPrices)

            return {
                id: productId,
                product: productObject,
                product_id: productId,
                current_display_price: priceInfo?.sale_price ?? '',
                sale_price: priceInfo?.sale_price ?? null,
            }
        })

        setEditableSalePrices(rows)

        setOrderProducts((prev) =>
            prev.map((product) => {
                const productId = getProductId(product)

                const priceInfo = customerPrices.find((cp) => Number(getProductId(cp)) === Number(productId))

                return {
                    ...product,
                    price_at_sale: priceInfo ? Number(priceInfo.sale_price) || 0 : 0,
                }
            }),
        )
    }, [customerId, customerPrices, productIdsKey, setOrderProducts])

    useEffect(() => {
        if (orderProducts.length === 0) {
            setEditablePurchasePrices([])

            return
        }

        const rows = orderProducts.map((productRow) => {
            const productId = getProductId(productRow)

            const priceInfo = warehousePrices.find((wp) => Number(getProductId(wp)) === Number(productId))

            const productObject = getProductObject(productRow, warehousePrices)

            return {
                id: productId,

                product: productObject,

                product_id: productId,

                current_display_price: priceInfo?.purchase_price ?? '',

                purchase_price: priceInfo?.purchase_price ?? null,
            }
        })

        setEditablePurchasePrices(rows)

        setOrderProducts((prev) =>
            prev.map((product) => {
                const productId = getProductId(product)

                const priceInfo = warehousePrices.find((wp) => Number(getProductId(wp)) === Number(productId))

                return {
                    ...product,

                    price_at_purchase: priceInfo ? Number(priceInfo.purchase_price) || 0 : 0,
                }
            }),
        )
    }, [warehouseId, warehousePrices, productIdsKey, setOrderProducts])

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
                    return {
                        ...item,
                        price_at_sale: numericValue,
                    }
                }

                return item
            }),
        )
    }

    const handlePriceAtPurchaseChange = (id, value) => {
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
                    return {
                        ...item,
                        price_at_purchase: numericValue,
                    }
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
                                {item.product?.name ?? '—'}
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

                <Typography variant="body2" sx={typographySx}>
                    {totalSalePrice.toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{' '}
                    руб.
                </Typography>
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
                value={form.warehouse || null}
                onChange={(event, newValue) => {
                    setForm((prev) => ({
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
                                {item.product?.name ?? item.product_name ?? '—'}
                            </Typography>

                            <TextField
                                size="small"
                                type="number"
                                value={item.current_display_price ?? ''}
                                onChange={(e) => handlePriceAtPurchaseChange(item.id, e.target.value)}
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

                <Typography variant="body2" sx={typographySx}>
                    {totalPurchasePrice.toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{' '}
                    руб.
                </Typography>
            </Stack>
        </AppSidebar>
    )
}
