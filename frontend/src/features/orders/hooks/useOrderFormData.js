import { useEffect, useState } from 'react'

import { mapOrderToForm } from '../utils/order.form.mappers.js'

export function useOrderFormData({
    isEdit,
    order,
    orderResources,
    isLoadingPage,
    pageLoadError,
    form,
    orderProducts,
    setForm,
    setOrderProducts,
    normalizeOrderProducts,
}) {
    const [initialSnapshot, setInitialSnapshot] = useState(null)

    useEffect(() => {
        if (!isEdit) return
        if (!order || !orderResources) return

        const mappedForm = mapOrderToForm(order, orderResources)
        const mappedProducts = normalizeOrderProducts(order.order_products)

        setForm(mappedForm)
        setOrderProducts(mappedProducts)

        setInitialSnapshot(
            JSON.stringify({
                form: mappedForm,
                products: mappedProducts,
            }),
        )
    }, [isEdit, order, orderResources]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isEdit || isLoadingPage || pageLoadError || initialSnapshot !== null) return

        setInitialSnapshot(
            JSON.stringify({
                form,
                products: orderProducts,
            }),
        )
    }, [isEdit, isLoadingPage, pageLoadError]) // eslint-disable-line react-hooks/exhaustive-deps

    const currentSnapshot = JSON.stringify({ form, products: orderProducts })
    const isDirty = initialSnapshot !== null && currentSnapshot !== initialSnapshot

    const markClean = () => {
        setInitialSnapshot(JSON.stringify({ form, products: orderProducts }))
    }

    return { isDirty, markClean }
}
