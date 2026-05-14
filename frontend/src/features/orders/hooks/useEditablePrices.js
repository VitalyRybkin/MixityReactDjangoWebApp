import { useEffect } from 'react'

import { getProductId, getProductObject } from '../utils/orderProducts.js'

export function useEditablePrices({
    products,
    orderProducts,
    objectId,
    prices,
    setEditablePrices,
    productIdsKey,
    setOrderProducts,
    priceSourceField,
    orderProductPriceField,
}) {
    useEffect(() => {
        if (orderProducts.length === 0) {
            setEditablePrices([])
            return
        }

        const rows = orderProducts.map((productRow) => {
            const productId = getProductId(productRow)
            const priceInfo = prices.find((p) => Number(getProductId(p)) === Number(productId))
            const productObject = getProductObject(productRow, prices, products)

            return {
                id: productId,
                product: productObject,
                product_id: productId,
                current_display_price: priceInfo?.[priceSourceField] ?? '',
                price: priceInfo?.[priceSourceField] ?? null,
            }
        })

        setEditablePrices(rows)

        setOrderProducts((prev) =>
            prev.map((product) => {
                const productId = getProductId(product)
                const priceInfo = prices.find((p) => Number(getProductId(p)) === Number(productId))

                return {
                    ...product,
                    [orderProductPriceField]: priceInfo ? Number(priceInfo[priceSourceField]) || 0 : 0,
                }
            }),
        )
    }, [objectId, prices, productIdsKey, setEditablePrices, setOrderProducts, priceSourceField, orderProductPriceField])
}
