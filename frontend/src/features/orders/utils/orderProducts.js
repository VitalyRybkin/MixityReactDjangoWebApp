import { MAX_PASSPORT_NUMBER, parsePassportNumber } from '../../../utils/qualityPassportNumbers.js'

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

const preparedPassportNumber = (row) => (row.productId ? parsePassportNumber(row.new_quality_passport?.number) : null)

export function allocateOrderPassportNumber(suggestion, rows, currentRowId) {
    let number = parsePassportNumber(suggestion)
    if (number === null) return null

    const occupied = new Set(rows.filter((row) => row.id !== currentRowId).map(preparedPassportNumber))
    while (occupied.has(number)) number += 1
    return number <= MAX_PASSPORT_NUMBER ? number : null
}

export function getOrderPassportNumberErrors(rows) {
    const firstRowByNumber = new Map()
    const errors = {}

    for (const row of rows) {
        const number = preparedPassportNumber(row)
        if (number === null) continue

        const firstRow = firstRowByNumber.get(number)
        if (firstRow) {
            const message = `Номер паспорта № ${number} уже указан для другого товара в этой заявке.`
            errors[firstRow.id] = message
            errors[row.id] = message
        } else {
            firstRowByNumber.set(number, row)
        }
    }
    return errors
}
