import { useMemo, useState } from 'react'

const emptyPartsRow = () => ({
    id: crypto.randomUUID(),
    partId: '',
    quantity: '',
    price_per_item: '',
    is_rebillable: false,
})

export function useRequestParts() {
    const [requestParts, setRequestParts] = useState([])
    const [partsErrors, setPartsErrors] = useState({})

    const totalPartsPrice = useMemo(() => {
        return requestParts.reduce((acc, row) => {
            const quantity = Number(String(row.quantity).replace(',', '.')) || 0

            const pricePerItem = Number(String(row.price_per_item).replace(',', '.')) || 0

            return acc + quantity * pricePerItem
        }, 0)
    }, [requestParts])

    const normalizeRequestParts = (items = []) =>
        items.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            partId: item.part?.id ?? item.part ?? '',
            quantity: item.quantity ?? '',
            price_per_item: item.price_per_item ?? '',
            is_rebillable: item.is_rebillable ?? false,
        }))

    const buildPartsPayload = (currentParts = requestParts) =>
        currentParts
            .filter((row) => row.partId && row.quantity)
            .map((row) => ({
                part: row.partId,
                quantity: row.quantity,
                price_per_item: Number(String(row.price_per_item).replace(',', '.')) || 0,
                is_rebillable: row.is_rebillable,
            }))

    const validate = () => {
        const errors = {}

        requestParts.forEach((row) => {
            const rowErrors = {}

            if (!row.partId) {
                rowErrors.partId = 'Выберите запчасть'
            }

            if (row.quantity === '' || row.quantity == null) {
                rowErrors.quantity = 'Укажите количество'
            }

            if (row.price_per_item === '' || row.price_per_item == null) {
                rowErrors.price_per_item = 'Укажите цену'
            }

            if (Object.keys(rowErrors).length > 0) {
                errors[row.id] = rowErrors
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

        setPartsErrors((prev) => {
            const next = { ...prev }

            if (!next[rowId]) {
                return prev
            }

            const rowErrors = {
                ...next[rowId],
            }

            Object.keys(updates).forEach((field) => {
                delete rowErrors[field]
            })

            if (Object.keys(rowErrors).length === 0) {
                delete next[rowId]
            } else {
                next[rowId] = rowErrors
            }

            return next
        })
    }

    const handleRemove = (rowId) => {
        setRequestParts((prev) => prev.filter((row) => row.id !== rowId))

        setPartsErrors((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
        })
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
