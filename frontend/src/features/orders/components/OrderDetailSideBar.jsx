import { useMemo, useState } from 'react'

import { Autocomplete, Divider, TextField, Typography } from '@mui/material'

import AppSidebar from '../../../layouts/AppSidebar.jsx'
import { useEditablePrices } from '../hooks/useEditablePrices.js'
import { useOrderTotals } from '../hooks/useOrderTotals.js'
import { handlePriceChange } from '../utils/handlePriceChange.js'
import { getProductId } from '../utils/orderProducts.js'

import OrderDeliveryDetail from './OrderDeliveryDetail.jsx'
import PriceSection from './PriceSection.jsx'

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

    const warehouseId = form?.warehouse?.id ?? form?.warehouse ?? null
    const customerId = form?.customer?.id ?? form?.customer ?? null

    const productIdsKey = useMemo(() => {
        return orderProducts.map(getProductId).filter(Boolean).map(String).sort().join(',')
    }, [orderProducts])

    const totalSalePrice = useOrderTotals(orderProducts, 'price_at_sale')
    const totalPurchasePrice = useOrderTotals(orderProducts, 'price_at_purchase')

    useEditablePrices({
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
            <PriceSection
                title="ПРОДАЖА"
                label="Цена продажи:"
                loading={loadingCustomerPrices}
                prices={editableSalePrices}
                total={totalSalePrice}
                onChange={handlePriceAtSaleChange}
            />

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

            <PriceSection
                label="Цена закупки:"
                loading={loadingWarehousePrices}
                prices={editablePurchasePrices}
                total={totalPurchasePrice}
                onChange={handlePriceAtPurchaseChange}
            />

            <Typography variant="h6" sx={{ mt: 3 }}>
                ДОСТАВКА
            </Typography>

            <Divider sx={{ my: 1 }} />

            <OrderDeliveryDetail />
        </AppSidebar>
    )
}
