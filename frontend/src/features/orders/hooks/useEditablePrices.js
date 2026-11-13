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
    // Track the last selection, even for persisted items. An existing item's
    // stored price belongs to its original product, not its replacement.
    const selectedProductIdsRef = useRef(new Map())
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
        const previousSelections = selectedProductIdsRef.current
        const nextSelections = new Map()
        const tracked = new Map()
        const updates = new Map()

        for (const row of orderProducts) {
            const productId = getProductId(row)
            const rowId = String(row.id)
            if (!productId) continue
            nextSelections.set(rowId, productId)

            const old = previous.get(rowId)
            const priorProductId = previousSelections.get(rowId)
            const selectionChanged = priorProductId != null && priorProductId !== productId
            const replacementPending = Boolean(old && old.productId !== productId)
            const replacing = selectionChanged || replacementPending
            if (isEdit && isPersistedItem(row) && !replacing) continue

            const reference = prices.find((price) => Number(price.product?.id) === Number(productId))
            const referenceValue = reference?.[priceSourceField]
            const referencePrice = Number(referenceValue)

            if (referenceValue == null || referenceValue === '' || !Number.isFinite(referencePrice)) {
                if (replacing) {
                    if (old?.pendingReplacement === productId && hasPrice(row, orderProductPriceField)) {
                        // After the stale price was cleared, a user typed a
                        // replacement price before its reference finished loading.
                        tracked.set(rowId, { productId, price: Number(row[orderProductPriceField]), manual: true })
                    } else {
                        // Keep the previous product identity until the new
                        // reference arrives; otherwise a saved A=100 is mistaken
                        // for an explicit manual B=100.
                        tracked.set(rowId, {
                            productId: old?.productId ?? priorProductId,
                            price: old?.price ?? Number(row[orderProductPriceField]),
                            manual: false,
                            pendingReplacement: productId,
                        })
                        if (hasPrice(row, orderProductPriceField)) {
                            updates.set(rowId, { productId, oldValue: row[orderProductPriceField], price: null })
                        }
                    }
                } else if (old && old.productId === productId) {
                    tracked.set(rowId, old)
                }
                continue
            }

            if (old && !replacing) {
                // Manual edits, including zero, must survive changes to other rows.
                const manuallyChanged = old.manual ||
                    (hasPrice(row, orderProductPriceField) && Number(row[orderProductPriceField]) !== old.price)
                if (manuallyChanged) {
                    tracked.set(rowId, { ...old, manual: true })
                    continue
                }
            } else if (!replacing && hasPrice(row, orderProductPriceField)) {
                // Existing explicit prices are authoritative for the same product.
                continue
            }

            tracked.set(rowId, { productId, price: referencePrice, manual: false })
            if (!hasPrice(row, orderProductPriceField) || Number(row[orderProductPriceField]) !== referencePrice) {
                updates.set(rowId, { productId, oldValue: row[orderProductPriceField], price: referencePrice })
            }
        }

        selectedProductIdsRef.current = nextSelections
        automaticPricesRef.current = tracked
        if (!updates.size) return

        setOrderProducts((currentRows) => {
            let changed = false
            const nextRows = currentRows.map((row) => {
                const update = updates.get(String(row.id))
                if (!update || getProductId(row) !== update.productId) return row
                // Avoid clobbering a more recent user edit / product selection.
                if (!Object.is(row[orderProductPriceField], update.oldValue)) return row
                if (Object.is(row[orderProductPriceField], update.price)) return row
                changed = true
                return { ...row, [orderProductPriceField]: update.price }
            })
            return changed ? nextRows : currentRows
        })
    }, [isEdit, objectId, prices, productIdsKey, orderProducts, setOrderProducts, priceSourceField, orderProductPriceField])
}
