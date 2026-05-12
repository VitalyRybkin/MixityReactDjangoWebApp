import { useMemo, useState } from 'react'

const emptyProductRow = () => ({
    id: crypto.randomUUID(),
    productId: '',
    quantity: '',
    packId: '',
    value: 0,
})

export function useOrderProducts(products = []) {
    const [orderProducts, setOrderProducts] = useState([])
    const [productErrors, setProductErrors] = useState({})

    const totalWeight = useMemo(() => {
        return orderProducts.reduce((acc, row) => {
            const product = products.find((item) => item.id === row.productId)
            const quantity = Number(String(row.quantity).replace(',', '.')) || 0
            const unitValue = Number(product?.product_unit?.value) || 0
            const isPieceBased = !product?.product_unit?.unit?.is_weight_based

            if (!quantity) return acc
            if (isPieceBased) return acc + (quantity * unitValue) / 1000
            return acc + quantity
        }, 0)
    }, [orderProducts, products])

    const normalizeOrderProducts = (items = []) =>
        items.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            productId: item.product?.id || '',
            quantity: item.piece_based_quantity ?? item.weight_quantity ?? '',
            packId: item.pack_type?.id || '',
            value: item.product?.product_unit?.value ?? 0,
            price_at_sale: item.price_at_sale,
            price_at_purchase: item.price_at_purchase,
        }))

    const buildProductsPayload = (currentProducts) =>
        (currentProducts || orderProducts)
            .filter((row) => row.productId && row.quantity)
            .map((row) => ({
                product: row.productId,
                quantity: row.quantity,
                package: row.packId || null,
                price_at_sale: Number(row.price_at_sale) || 0,
                price_at_purchase: Number(row.price_at_purchase) || 0,
            }))

    const validate = () => {
        const errors = {}
        orderProducts.forEach((row) => {
            if (row.productId && (row.quantity === '' || row.quantity == null)) {
                errors[row.id] = 'Пожалуйста, заполните поле'
            }
        })
        setProductErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleAdd = () => {
        setOrderProducts((prev) => [...prev, emptyProductRow()])
    }

    const handleChange = (rowId, updates) => {
        setOrderProducts((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)))
        if ('quantity' in updates && updates.quantity !== '') {
            setProductErrors((prev) => {
                const next = { ...prev }
                delete next[rowId]
                return next
            })
        }
    }

    const handleRemove = (rowId) => {
        setOrderProducts((prev) => prev.filter((row) => row.id !== rowId))
    }

    return {
        orderProducts,
        setOrderProducts,
        productErrors,
        totalWeight,
        normalizeOrderProducts,
        buildProductsPayload,
        validate,
        handleAdd,
        handleChange,
        handleRemove,
    }
}
