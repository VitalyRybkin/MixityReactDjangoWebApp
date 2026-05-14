import { getProductId } from './orderProducts.js'

export function handlePriceChange({ id, value, editablePrices, setEditablePrices, setOrderProducts, priceType }) {
    const numericValue = value === '' ? 0 : parseFloat(value)

    setEditablePrices((prev) => prev.map((item) => (item.id === id ? { ...item, current_display_price: value } : item)))

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
                }
            }

            return item
        }),
    )
}
