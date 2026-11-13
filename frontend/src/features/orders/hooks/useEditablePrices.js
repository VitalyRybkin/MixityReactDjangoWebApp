import { useEffect, useRef } from 'react'

import { getProductId, getProductObject } from '../utils/orderProducts.js'

// A saved zero is a real price. Only a genuinely missing field can display a
// reference price that has not yet been written to the order item.
const hasPrice = (row, field) => row[field] !== null && row[field] !== undefined && row[field] !== ''

const sameDisplayedPrices = (left, right) =>
    left.length === right.length &&
    left.every((item, i) =>
        item.id === right[i].id &&
        item.product === right[i].product &&
        item.current_display_price === right[i].current_display_price,
    )

const isPersistedItem = (row) => typeof row.id === 'number' || /^\d+$/.test(String(row.id))

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
    // Tracks automatic prices only for newly-added rows. A manually changed
    // price (including zero) must not be replaced when other products change.
    const automaticPricesRef = useRef(new Map())

    useEffect(() => {
        const rows = orderProducts.map((row) => {
            const productId = getProductId(row)
            const reference = prices.find((price) => Number(price.product?.id) === Number(productId))
            return {
                id: productId,
                product: getProductObject(row, prices, products),
                product_id: productId,
                current_display_price: hasPrice(row, orderProductPriceField)
                    ? row[orderProductPriceField]
                    : (reference?.[priceSourceField] ?? ''),
            }
        })
        setEditablePrices((old) => sameDisplayedPrices(old, rows) ? old : rows)
    }, [orderProducts, products, prices, setEditablePrices, priceSourceField, orderProductPriceField])

    useEffect(() => {
        const previous = automaticPricesRef.current
        const tracked = new Map()
        const updates = new Map()

        for (const row of orderProducts) {
            const productId = getProductId(row)
            if (!productId || (isEdit && isPersistedItem(row))) continue

            const rowId = String(row.id)
            const old = previous.get(rowId)
            const reference = prices.find((price) => Number(price.product?.id) === Number(productId))
            const referenceValue = reference?.[priceSourceField]
            const referencePrice = Number(referenceValue)

            if (referenceValue == null || referenceValue === '' || !Number.isFinite(referencePrice)) {
                if (old && old.productId === productId) tracked.set(rowId, old)
                continue
            }

            const newSelection = Boolean(old && old.productId !== productId)
            if (old && !newSelection) {
                // Manual edits are inferred by comparing the current product
                // field with the last automatically applied price.
                const manuallyChanged = old.manual ||
                    (hasPrice(row, orderProductPriceField) && Number(row[orderProductPriceField]) !== old.price)

                if (manuallyChanged) {
                    tracked.set(rowId, { ...old, manual: true })
                    continue
                }
            } else if (!newSelection && hasPrice(row, orderProductPriceField)) {
                // Pre-existing explicit values (including zero) win over the
                // reference; they may have been entered before this effect ran.
                continue
            }

            tracked.set(rowId, { productId, price: referencePrice, manual: false })
            if (!hasPrice(row, orderProductPriceField) || Number(row[orderProductPriceField]) !== referencePrice) {
                updates.set(rowId, { productId, oldValue: row[orderProductPriceField], price: referencePrice })
            }
        }

        automaticPricesRef.current = tracked
        if (!updates.size) return

        setOrderProducts((currentRows) => {
            let changed = false
            const nextRows = currentRows.map((row) => {
                const update = updates.get(String(row.id))
                if (!update || getProductId(row) !== update.productId) return row
                // Don't overwrite a newer manual edit made between calculation
                // and React processing this state update.
                if (!Object.is(row[orderProductPriceField], update.oldValue)) return row
                if (hasPrice(row, orderProductPriceField) && Number(row[orderProductPriceField]) === update.price) return row
                changed = true
                return { ...row, [orderProductPriceField]: update.price }
            })
            return changed ? nextRows : currentRows
        })
    }, [isEdit, objectId, prices, productIdsKey, orderProducts, setOrderProducts, priceSourceField, orderProductPriceField])
}
