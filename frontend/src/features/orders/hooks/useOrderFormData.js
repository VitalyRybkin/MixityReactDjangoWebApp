import { useEffect, useState } from 'react'

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
        if (!isEdit) {
            return
        }

        if (!order || !orderResources) {
            return
        }

        const mappedForm = mapOrderToForm(order, orderResources)
        const mappedProducts = normalizeOrderProducts(order.order_products)
        const mappedDelivery = order.order_delivery ?? order.delivery ?? orderDelivery

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
    }, [isEdit, order, orderResources]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isEdit || isLoadingPage || pageLoadError || initialSnapshot !== null) {
            return
        }

        setInitialSnapshot(
            makeSnapshot({
                form,
                products: orderProducts,
                delivery: orderDelivery,
            }),
        )

        setIsDirty(false)
        setIsInitialized(true)
    }, [isEdit, isLoadingPage, pageLoadError]) // eslint-disable-line react-hooks/exhaustive-deps

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
