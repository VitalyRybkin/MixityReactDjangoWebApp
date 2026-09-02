import { useMemo, useState } from 'react'

import { Autocomplete, Box, Divider, TextField, Typography } from '@mui/material'

import AppSidebar from '../../../layouts/AppSidebar.jsx'
import { useEditablePrices } from '../hooks/useEditablePrices.js'
import { useOrderTotals } from '../hooks/useOrderTotals.js'
import { handlePriceChange } from '../utils/handlePriceChange.js'
import { getProductId } from '../utils/orderProducts.js'

import OrderDeliveryDetail from './OrderDeliveryDetail.jsx'
import { orderDetailSideBarSx as sx } from './OrderDetailSideBar.styles.js'
import PriceSection from './PriceSection.jsx'

export default function OrderDetailSideBar({
    isEdit,
    open,
    setOpen,
    customerPrices,
    loadingCustomerPrices,
    warehousePrices,
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

    const warehouseId = form?.warehouse?.id ?? form?.warehouse ?? null
    const customerId = form?.customer?.id ?? form?.customer ?? null

    const productIdsKey = useMemo(() => {
        return orderProducts.map(getProductId).filter(Boolean).map(String).sort().join(',')
    }, [orderProducts])

    const totalSalePrice = useOrderTotals(orderProducts, editableSalePrices)
    const totalPurchasePrice = useOrderTotals(orderProducts, editablePurchasePrices)

    useEditablePrices({
        isEdit,
        products,
        orderProducts,
        objectId: customerId,
        prices: customerPrices,
        setEditablePrices: setEditableSalePrices,
        productIdsKey,
        setOrderProducts,
        priceSourceField: 'sale_price',
        orderProductPriceField: 'price_at_sale',
    })

    useEditablePrices({
        isEdit,
        products,
        orderProducts,
        objectId: warehouseId,
        prices: warehousePrices,
        setEditablePrices: setEditablePurchasePrices,
        productIdsKey,
        setOrderProducts,
        priceSourceField: 'purchase_price',
        orderProductPriceField: 'price_at_purchase',
    })

    const handlePriceAtSaleChange = (id, value) =>
        handlePriceChange({
            id,
            value,
            editablePrices: editableSalePrices,
            setEditablePrices: setEditableSalePrices,
            setOrderProducts,
            priceType: 'price_at_sale',
        })

    const handlePriceAtPurchaseChange = (id, value) =>
        handlePriceChange({
            id,
            value,
            editablePrices: editablePurchasePrices,
            setEditablePrices: setEditablePurchasePrices,
            setOrderProducts,
            priceType: 'price_at_purchase',
        })

    return (
        <AppSidebar open={open} setOpen={setOpen}>
            <Box component="fieldset" sx={sx.section}>
                <PriceSection
                    title="ПРОДАЖА"
                    label="Цена продажи:"
                    loading={loadingCustomerPrices}
                    prices={editableSalePrices}
                    total={totalSalePrice}
                    onChange={handlePriceAtSaleChange}
                />
            </Box>

            <Box component="fieldset" sx={sx.section}>
                <Typography variant="h6" sx={sx.title}>
                    ЗАКУПКА
                </Typography>

                <Divider sx={sx.divider} />

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
                    sx={sx.warehouseField}
                />

                <PriceSection
                    label="Цена закупки:"
                    loading={loadingWarehousePrices}
                    prices={editablePurchasePrices}
                    total={totalPurchasePrice}
                    onChange={handlePriceAtPurchaseChange}
                />
            </Box>

            <Box component="fieldset" sx={sx.section}>
                <Typography variant="h6" sx={sx.title}>
                    ДОСТАВКА
                </Typography>

                <Divider sx={sx.divider} />

                <OrderDeliveryDetail />
            </Box>
        </AppSidebar>
    )
}
