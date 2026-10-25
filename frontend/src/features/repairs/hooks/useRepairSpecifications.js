import { useMemo, useState } from 'react'

const createSpecificationRow = (type) => ({
    id: crypto.randomUUID(),
    type,
    serviceId: '',
    partId: '',
    quantity: '',
    price_per_item: '',
    is_rebillable: false,
})

const toNumber = (value) => {
    if (value === '' || value == null) {
        return 0
    }

    return Number(String(value).replace(',', '.')) || 0
}

export function useRepairSpecifications() {
    const [repairRequestSpecifications, setRepairRequestSpecifications] = useState([])
    const [specificationErrors, setSpecificationErrors] = useState({})

    const serviceSpecifications = useMemo(
        () => repairRequestSpecifications.filter((item) => item.type === 'service'),
        [repairRequestSpecifications],
    )

    const partSpecifications = useMemo(
        () => repairRequestSpecifications.filter((item) => item.type === 'part'),
        [repairRequestSpecifications],
    )

    const totalPrice = useMemo(
        () =>
            repairRequestSpecifications.reduce((total, item) => {
                const quantity = toNumber(item.quantity)
                const pricePerItem = toNumber(item.price_per_item)

                return total + quantity * pricePerItem
            }, 0),
        [repairRequestSpecifications],
    )

    const totalRebillablePrice = useMemo(
        () =>
            repairRequestSpecifications.reduce((total, item) => {
                if (!item.is_rebillable) {
                    return total
                }

                const quantity = toNumber(item.quantity)
                const pricePerItem = toNumber(item.price_per_item)

                return total + quantity * pricePerItem
            }, 0),
        [repairRequestSpecifications],
    )

    const normalizeSpecifications = (items = []) =>
        items.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            type: item.service ? 'service' : 'part',
            serviceId: item.service?.id ?? '',
            partId: item.part?.id ?? '',
            quantity: item.quantity ?? '',
            price_per_item: item.price_per_item ?? '',
            is_rebillable: Boolean(item.is_rebillable),
        }))

    const buildSpecificationsPayload = (items = repairRequestSpecifications) =>
        items.map((item) => ({
            service: item.type === 'service' ? item.serviceId || null : null,
            part: item.type === 'part' ? item.partId || null : null,
            quantity: String(item.quantity).replace(',', '.'),
            price_per_item: String(item.price_per_item).replace(',', '.'),
            is_rebillable: Boolean(item.is_rebillable),
        }))

    const validate = () => {
        const errors = {}

        repairRequestSpecifications.forEach((item) => {
            const rowErrors = {}

            if (item.type === 'service' && !item.serviceId) {
                rowErrors.item = 'Выберите услугу.'
            }

            if (item.type === 'part' && !item.partId) {
                rowErrors.item = 'Выберите запчасть.'
            }

            if (toNumber(item.quantity) <= 0) {
                rowErrors.quantity = 'Укажите количество больше 0.'
            }

            if (
                item.price_per_item === '' ||
                item.price_per_item == null ||
                toNumber(item.price_per_item) < 0
            ) {
                rowErrors.price_per_item = 'Укажите корректную цену.'
            }

            if (Object.keys(rowErrors).length > 0) {
                errors[item.id] = rowErrors
            }
        })

        setSpecificationErrors(errors)

        return Object.keys(errors).length === 0
    }

    const handleAddService = () => {
        setRepairRequestSpecifications((prev) => [
            ...prev,
            createSpecificationRow('service'),
        ])
    }

    const handleAddPart = () => {
        setRepairRequestSpecifications((prev) => [
            ...prev,
            createSpecificationRow('part'),
        ])
    }

    const handleChange = (rowId, updates) => {
        setRepairRequestSpecifications((prev) =>
            prev.map((item) =>
                item.id === rowId
                    ? {
                        ...item,
                        ...updates,
                    }
                    : item,
            ),
        )

        setSpecificationErrors((prev) => {
            if (!prev[rowId]) {
                return prev
            }

            const next = { ...prev }
            delete next[rowId]

            return next
        })
    }

    const handleRemove = (rowId) => {
        setRepairRequestSpecifications((prev) =>
            prev.filter((item) => item.id !== rowId),
        )

        setSpecificationErrors((prev) => {
            if (!prev[rowId]) {
                return prev
            }

            const next = { ...prev }
            delete next[rowId]

            return next
        })
    }

    return {
        specifications: repairRequestSpecifications,
        setSpecifications: setRepairRequestSpecifications,

        serviceSpecifications,
        partSpecifications,

        specificationErrors,

        totalPrice,
        totalRebillablePrice,

        normalizeSpecifications,
        buildSpecificationsPayload,
        validate,

        handleAddService,
        handleAddPart,
        handleChange,
        handleRemove,
    }
}