import { useEffect, useRef } from 'react'

import { normalizeOrderPrice } from '../utils/orderPrices.js'
import { getProductId, getProductObject } from '../utils/orderProducts.js'

const sameDisplayedPrices = (left, right) =>
    left.length === right.length &&
    left.every(
        (item, i) =>
            item.id === right[i].id &&
            item.product === right[i].product &&
            item.current_display_price === right[i].current_display_price,
    )

const isPersistedItem = (row) => typeof row.id === 'number' || /^\d+$/.test(String(row.id))
const productKey = (row) => String(getProductId(row) ?? '')

export function useEditablePrices({
    isEdit,
    products,
    orderProducts,
    objectId,
    prices,
    pricesReady = true,
    isHydrated = true,
    onReferencePricesChange,
    setEditablePrices,
    productIdsKey,
    setOrderProducts,
    priceSourceField,
    orderProductPriceField,
}) {
    const contextRef = useRef(null)
    const rowsRef = useRef(new Map())
    const notificationRef = useRef(null)
    const revisionField = `${orderProductPriceField}_revision`
    const clearedField = `${orderProductPriceField}_cleared`

    useEffect(() => {
        const rows = orderProducts.map((row) => ({
            id: getProductId(row),
            product: getProductObject(row, prices, products),
            product_id: getProductId(row),
            current_display_price: row[orderProductPriceField] ?? '',
        }))
        setEditablePrices((old) => (sameDisplayedPrices(old, rows) ? old : rows))
    }, [orderProducts, products, prices, setEditablePrices, orderProductPriceField])

    useEffect(() => {
        if (!isHydrated) return

        const entityKey = String(objectId ?? '')
        const entityChanged = contextRef.current !== null && contextRef.current !== entityKey
        const previous = rowsRef.current
        const tracked = new Map()
        const updates = new Map()

        if (entityChanged) {
            // Compare settled prices with the values before this selection, not
            // with the temporary nulls used while its reference query is loading.
            notificationRef.current = {
                entityKey,
                notified: false,
                baseline: new Map(
                    orderProducts.flatMap((row) => {
                        const old = previous.get(String(row.id))
                        return old?.productKey && old.productKey === productKey(row)
                            ? [
                                  [
                                      String(row.id),
                                      {
                                          productKey: old.productKey,
                                          price: normalizeOrderPrice(row[orderProductPriceField]),
                                      },
                                  ],
                              ]
                            : []
                    }),
                ),
            }
        }
        contextRef.current = entityKey

        for (const row of orderProducts) {
            const id = String(row.id)
            const selectedProduct = productKey(row)
            const old = previous.get(id)
            const revision = row[revisionField] ?? 0
            const productChanged = old !== undefined && old.productKey !== selectedProduct
            const newContext = entityChanged || productChanged
            let manual =
                old?.manual ??
                ((isEdit && isPersistedItem(row)) ||
                    normalizeOrderPrice(row[orderProductPriceField]) !== null ||
                    Boolean(row[clearedField]))

            // An old override belongs to the old entity/product. A revision
            // after that switch, including an explicit zero/clear, belongs to
            // the new context and must win over subsequent query responses.
            if (newContext) manual = false
            else if (old && old.revision !== revision) manual = true

            const reference =
                pricesReady && selectedProduct && entityKey
                    ? prices.find((price) => String(price.product?.id) === selectedProduct)
                    : null
            const referencePrice = normalizeOrderPrice(reference?.[priceSourceField])
            let nextPrice = normalizeOrderPrice(row[orderProductPriceField])
            if (!selectedProduct || newContext || (!manual && pricesReady)) {
                nextPrice = referencePrice
            }

            tracked.set(id, { productKey: selectedProduct, revision, manual })
            const resetClear = newContext && Boolean(row[clearedField])
            if (!Object.is(row[orderProductPriceField], nextPrice) || resetClear) {
                updates.set(id, {
                    productKey: selectedProduct,
                    revision,
                    oldValue: row[orderProductPriceField],
                    price: nextPrice,
                    resetClear,
                })
            }
        }
        rowsRef.current = tracked

        if (updates.size) {
            setOrderProducts((currentRows) => {
                if (contextRef.current !== entityKey) return currentRows
                let changed = false
                const nextRows = currentRows.map((row) => {
                    const update = updates.get(String(row.id))
                    if (
                        !update ||
                        productKey(row) !== update.productKey ||
                        (row[revisionField] ?? 0) !== update.revision ||
                        !Object.is(row[orderProductPriceField], update.oldValue)
                    )
                        return row
                    changed = true
                    return {
                        ...row,
                        [orderProductPriceField]: update.price,
                        ...(update.resetClear ? { [clearedField]: false } : {}),
                    }
                })
                return changed ? nextRows : currentRows
            })
            return
        }

        const notification = notificationRef.current
        if (!isEdit || !pricesReady || !notification || notification.notified || notification.entityKey !== entityKey)
            return

        // Notify from the effect only after the price updates have committed.
        // Mark first, so StrictMode and callback-triggered rerenders cannot repeat it.
        notification.notified = true
        let changed = false
        let missing = false

        for (const row of orderProducts) {
            const id = String(row.id)
            const baseline = notification.baseline.get(id)

            if (!baseline || baseline.productKey !== productKey(row) || tracked.get(id)?.manual) {
                continue
            }

            const price = normalizeOrderPrice(row[orderProductPriceField])
            const priceChanged = !Object.is(price, baseline.price)

            if (priceChanged) {
                changed = true
                if (price === null) {
                    missing = true
                }
            }
        }

        if (changed) onReferencePricesChange?.({ field: orderProductPriceField, missing })
    }, [
        isEdit,
        isHydrated,
        objectId,
        prices,
        pricesReady,
        orderProducts,
        productIdsKey,
        setOrderProducts,
        priceSourceField,
        orderProductPriceField,
        revisionField,
        clearedField,
        onReferencePricesChange,
    ])
}
