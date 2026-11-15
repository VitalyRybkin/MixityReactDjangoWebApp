// Missing and invalid prices stay distinct from an explicitly entered zero.
export function normalizeOrderPrice(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null
    if (typeof value === 'string' && !value.trim()) return null

    const price = Number(value)
    return Number.isFinite(price) ? price : null
}

export const hasValidOrderPrices = (row) =>
    ['price_at_sale', 'price_at_purchase'].every((field) => normalizeOrderPrice(row[field]) !== null)
