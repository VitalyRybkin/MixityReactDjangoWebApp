import { useMemo } from 'react'

import { getProductId } from '../utils/orderProducts.js'

export function useOrderTotals(orderProducts, editablePrices) {
    return useMemo(() => {
        return orderProducts.reduce((acc, item) => {
            const productId = getProductId(item)

            const priceRow = editablePrices.find((price) => Number(price.product_id) === Number(productId))

            const price = Number(priceRow?.current_display_price) || 0
            const qty = Number(item.quantity) || 0

            return acc + price * qty
        }, 0)
    }, [orderProducts, editablePrices])
}
