import { useEffect } from 'react'

import { getProductId, getProductObject } from '../utils/orderProducts.js'

export function useEditablePrices({
    isEdit,
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

            const priceInfo = prices.find((p) => Number(p.product?.id) === Number(productId))

            const productObject = getProductObject(productRow, prices, products)

            const savedPrice = productRow[orderProductPriceField]
            const listedPrice = priceInfo?.[priceSourceField]

            const hasSavedPrice =
                savedPrice !== null && savedPrice !== undefined && savedPrice !== '' && Number(savedPrice) !== 0

            return {
                id: productId,
                product: productObject,
                product_id: productId,
                current_display_price: hasSavedPrice ? savedPrice : (listedPrice ?? ''),
            }
        })

        setEditablePrices(rows)

        if (!isEdit) {
            setOrderProducts((prev) =>
                prev.map((product) => {
                    const productId = getProductId(product)

                    const priceInfo = prices.find((p) => Number(p.product?.id) === Number(productId))

                    return {
                        ...product,
                        [orderProductPriceField]: priceInfo ? Number(priceInfo[priceSourceField]) || 0 : 0,
                    }
                }),
            )
        }
    }, [objectId, prices, productIdsKey, setEditablePrices, setOrderProducts, priceSourceField, orderProductPriceField])
}
