import { useMemo, useState } from 'react'

const emptyPartsRow = () => ({
    id: crypto.randomUUID(),
    partId: '',
    quantity: '',
    price: '',
    is_rebillable: false,
})

export function useRequestParts(parts = []) {
    const [requestParts, setRequestParts] = useState([])
    const [partsErrors, setPartsErrors] = useState({})

    const totalPartsPrice = useMemo(() => {
        return requestParts.reduce((acc, row) => {
            const price_per_item = Number(String(row.quantity).replace(',', '.')) || 0
            const quantity = Number(String(row.quantity).replace(',', '.')) || 0
            if (!quantity) return acc
            return acc + quantity * price_per_item
        }, 0)
    }, [requestParts, parts])

    const normalizeRequestParts = (items = []) =>
        items.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            partId: item.part?.id || '',
            quantity: item.quantity || '',
            price_per_item: Number(item.price_per_item) || 0,
        }))

    const buildPartsPayload = (currentParts) =>
        (currentParts || requestParts)
            .filter((row) => row.partId && row.quantity)
            .map((row) => ({
                part: row.partId,
                quantity: row.quantity,
                price_per_item: Number(row.price_per_item) || 0,
            }))

    const validate = () => {
        const errors = {}
        requestParts.forEach((row) => {
            if (row.partId && (row.quantity === '' || row.quantity == null)) {
                errors[row.id] = 'Пожалуйста, заполните поле'
            }
        })
        setPartsErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleAdd = () => {
        setRequestParts((prev) => [...prev, emptyPartsRow()])
    }

    const handleChange = (rowId, updates) => {
        setRequestParts((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)))
        if ('quantity' in updates && updates.quantity !== '') {
            setPartsErrors((prev) => {
                const next = { ...prev }
                delete next[rowId]
                return next
            })
        }
    }

    const handleRemove = (rowId) => {
        setRequestParts((prev) => prev.filter((row) => row.id !== rowId))
    }

    return {
        requestParts,
        setRequestParts,
        partsErrors,
        totalPartsPrice,
        normalizeRequestParts,
        buildPartsPayload,
        validate,
        handleAdd,
        handleChange,
        handleRemove,
    }
}
