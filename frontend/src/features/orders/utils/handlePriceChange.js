import { getProductId } from './orderProducts.js'
import { normalizeOrderPrice } from './orderPrices.js'

export function handlePriceChange({ id, value, editablePrices, setEditablePrices, setOrderProducts, priceType }) {
    const numericValue = normalizeOrderPrice(value)

    setEditablePrices((prev) => prev.map((item) => (item.id === id ? { ...item, current_display_price: numericValue } : item)))

    const targetPriceItem = editablePrices.find((p) => p.id === id)

    if (!targetPriceItem) return

    const productId = getProductId(targetPriceItem)

    setOrderProducts((prev) =>
        prev.map((item) => {
            const itemProductId = getProductId(item)

            if (Number(itemProductId) === Number(productId)) {
                return {
                    ...item,
                    [priceType]: numericValue,
                    // A deliberate clear must survive reference-price loading.
                    [`${priceType}_cleared`]: numericValue === null,
                }
            }

            return item
        }),
    )
}
