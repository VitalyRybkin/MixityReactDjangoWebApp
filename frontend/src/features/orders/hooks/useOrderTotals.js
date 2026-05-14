import { useMemo } from 'react'

export function useOrderTotals(orderProducts, fieldName) {
    return useMemo(() => {
        return orderProducts.reduce((acc, item) => {
            const price = Number(item[fieldName]) || 0
            const qty = Number(item.quantity) || 0

            return acc + price * qty
        }, 0)
    }, [orderProducts, fieldName])
}
