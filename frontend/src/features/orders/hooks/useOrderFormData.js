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
    const [isInitialized, setIsInitialized] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (!isInitialized || initialSnapshot === null) return
        const currentSnapshot = JSON.stringify({ form, products: orderProducts })
        setIsDirty(currentSnapshot !== initialSnapshot)
    }, [form, orderProducts, initialSnapshot, isInitialized])

    useEffect(() => {
        if (!isEdit) return
        if (!order || !orderResources) return

        const mappedForm = mapOrderToForm(order, orderResources)
        const mappedProducts = normalizeOrderProducts(order.order_products)

        setForm(mappedForm)
        setOrderProducts(mappedProducts)
        setInitialSnapshot(JSON.stringify({ form: mappedForm, products: mappedProducts }))
        setIsInitialized(true)
    }, [isEdit, order, orderResources]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!isInitialized || initialSnapshot === null) return
        const current = JSON.stringify({ form, products: orderProducts })
        if (current !== initialSnapshot) {
            console.log('DIFF detected')
            console.log('initial:', JSON.parse(initialSnapshot))
            console.log('current:', JSON.parse(current))
        }
    }, [form, orderProducts, initialSnapshot, isInitialized])

    useEffect(() => {
        if (isEdit || isLoadingPage || pageLoadError || initialSnapshot !== null) return

        setInitialSnapshot(
            JSON.stringify({
                form,
                products: orderProducts,
            }),
        )

        setIsInitialized(true)

    }, [isEdit, isLoadingPage, pageLoadError]) // eslint-disable-line react-hooks/exhaustive-deps


    const markClean = () => {
        setInitialSnapshot(JSON.stringify({ form, products: orderProducts }))
    }

    return { isDirty, markClean }
}
