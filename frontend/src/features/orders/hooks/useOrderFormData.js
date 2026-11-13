import { useEffect, useRef, useState } from 'react'

import { mapOrderToForm } from '../utils/order.form.mappers.js'

const makeSnapshot = ({ form, products, delivery }) =>
    JSON.stringify({
        form,
        products,
        delivery,
    })

export function useOrderFormData({
    isEdit,
    order,
    orderResources,
    isLoadingPage,
    pageLoadError,
    form,
    orderProducts,
    orderDelivery,
    setForm,
    setOrderProducts,
    setOrderDelivery,
    normalizeOrderProducts,
}) {
    const [initialSnapshot, setInitialSnapshot] = useState(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    // A ref is updated synchronously, so a background query refresh (or a
    // second effect run in StrictMode) cannot reinitialize the same order.
    const initializedForRef = useRef(null)

    useEffect(() => {
        if (!isInitialized || initialSnapshot === null) {
            return
        }

        const currentSnapshot = makeSnapshot({
            form,
            products: orderProducts,
            delivery: orderDelivery,
        })

        setIsDirty(currentSnapshot !== initialSnapshot)
    }, [form, orderProducts, orderDelivery, initialSnapshot, isInitialized])

    useEffect(() => {
        if (!isEdit || !order?.id || !orderResources || isLoadingPage || pageLoadError) {
            return
        }

        const initializationKey = `order:${order.id}`
        if (initializedForRef.current === initializationKey) {
            return
        }

        const mappedForm = mapOrderToForm(order, orderResources)
        const mappedProducts = normalizeOrderProducts(order.order_products)
        const mappedDelivery = order.order_delivery ?? order.delivery ?? orderDelivery

        // Mark the order as initialized before any state updates. A refetch of
        // resources/order data must not overwrite unsaved form or passport edits.
        initializedForRef.current = initializationKey

        setForm(mappedForm)
        setOrderProducts(mappedProducts)
        setOrderDelivery(mappedDelivery)

        setInitialSnapshot(
            makeSnapshot({
                form: mappedForm,
                products: mappedProducts,
                delivery: mappedDelivery,
            }),
        )

        setIsDirty(false)
        setIsInitialized(true)
    }, [
        isEdit,
        order,
        orderResources,
        isLoadingPage,
        pageLoadError,
        normalizeOrderProducts,
        orderDelivery,
        setForm,
        setOrderProducts,
        setOrderDelivery,
    ])

    useEffect(() => {
        if (isEdit || isLoadingPage || pageLoadError || initializedForRef.current === 'create') {
            return
        }

        initializedForRef.current = 'create'

        setInitialSnapshot(
            makeSnapshot({
                form,
                products: orderProducts,
                delivery: orderDelivery,
            }),
        )

        setIsDirty(false)
        setIsInitialized(true)
    }, [isEdit, isLoadingPage, pageLoadError, form, orderProducts, orderDelivery])

    const markClean = () => {
        setInitialSnapshot(
            makeSnapshot({
                form,
                products: orderProducts,
                delivery: orderDelivery,
            }),
        )

        setIsDirty(false)
    }

    return {
        isDirty,
        markClean,
    }
}
