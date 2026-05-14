export function getProductId(item) {
    if (!item) return null

    if (typeof item.product === 'object') {
        return item.product?.id
    }

    if (typeof item.productId === 'object') {
        return item.productId?.id
    }

    if (typeof item.product_id === 'object') {
        return item.product_id?.id
    }

    return item.product ?? item.product_id ?? item.productId ?? null
}

export function getProductObject(item, prices = [], products = []) {
    if (!item) return null

    if (typeof item.product === 'object') {
        return item.product
    }

    if (typeof item.productId === 'object') {
        return item.productId
    }

    if (typeof item.product_id === 'object') {
        return item.product_id
    }

    const productId = getProductId(item)

    return (
        prices.find((price) => Number(getProductId(price)) === Number(productId))?.product ??
        products.find((product) => Number(product.id) === Number(productId)) ??
        null
    )
}
