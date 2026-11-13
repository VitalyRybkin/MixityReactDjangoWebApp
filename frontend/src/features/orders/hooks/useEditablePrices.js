import { useEffect, useRef } from 'react'

import { getProductId, getProductObject } from '../utils/orderProducts.js'

// Keep display values in sync with the order without retriggering writes endlessly.
const samePriceRows = (left, right) =>
    left.length === right.length &&
    left.every((row, index) => {
        const other = right[index]
        return (
            row.id === other.id &&
            row.product === other.product &&
            row.product_id === other.product_id &&
            row.current_display_price === other.current_display_price
        )
    })

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
    const lastPriceSourceRef = useRef(null)

    useEffect(() => {
        const previous = lastPriceSourceRef.current
        const sourceChanged =
            !previous ||
            previous.objectId !== objectId ||
            previous.prices !== prices ||
            previous.productIdsKey !== productIdsKey ||
            previous.priceSourceField !== priceSourceField ||
            previous.orderProductPriceField !== orderProductPriceField

        lastPriceSourceRef.current = {
            objectId,
            prices,
            productIdsKey,
            priceSourceField,
            orderProductPriceField,
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

        setEditablePrices((previousRows) => (samePriceRows(previousRows, rows) ? previousRows : rows))

        // A change to quantities/manual prices must not reapply reference prices.
        // Only a changed selection or price list refresh is allowed to do so.
        if (!isEdit && sourceChanged && orderProducts.length > 0) {
            setOrderProducts((previousProducts) => {
                let changed = false
                const updatedProducts = previousProducts.map((product) => {
                    const productId = getProductId(product)
                    const priceInfo = prices.find((p) => Number(p.product?.id) === Number(productId))
                    const nextPrice = priceInfo ? Number(priceInfo[priceSourceField]) || 0 : 0
                    if (Object.is(product[orderProductPriceField], nextPrice)) return product
                    changed = true
                    return { ...product, [orderProductPriceField]: nextPrice }
                })
                return changed ? updatedProducts : previousProducts
            })
        }
    }, [
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
    ])
}
