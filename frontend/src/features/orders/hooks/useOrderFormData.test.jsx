import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFormLogic } from '../../../hooks/useEntityForm.js'
import { emptyDeliveryInfo, emptyOrderForm } from '../utils/order.form.constants.js'
import { toOrderPayload } from '../utils/order.form.mappers.js'

import { useOrderFormData } from './useOrderFormData.js'
import { useOrderProducts } from './useOrderProducts.js'

const ARCHIVED_WAREHOUSE = { id: 7, name: 'Historical warehouse', is_active: false }
const ACTIVE_WAREHOUSE = { id: 8, name: 'Active warehouse' }
const CUSTOMER = { id: 2, name: 'Customer', customer_objects: [], contacts: [] }
const ORDER = {
    id: 42,
    client: { id: 1, name: 'Supplier' },
    customer: CUSTOMER,
    warehouse: ARCHIVED_WAREHOUSE,
    description: 'Original description',
    order_products: [],
}
const RESOURCES = { customers: [CUSTOMER], warehouses: [ACTIVE_WAREHOUSE], products: [] }

let container
let root
let current
let props
let updateMutation

function Harness({ order, orderResources }) {
    const products = useOrderProducts(orderResources.products)
    const [orderDelivery, setOrderDelivery] = useState(emptyDeliveryInfo)
    const formLogic = useFormLogic({
        isEdit: true,
        id: order.id,
        emptyForm: emptyOrderForm,
        updateMutation,
        redirectPath: '/',
        toPayload: (form) => toOrderPayload(form, order),
    })
    const formData = useOrderFormData({
        isEdit: true,
        order,
        orderResources,
        isLoadingPage: false,
        pageLoadError: null,
        form: formLogic.form,
        orderProducts: products.orderProducts,
        orderDelivery,
        setForm: formLogic.setForm,
        setOrderProducts: products.setOrderProducts,
        setOrderDelivery,
        normalizeOrderProducts: products.normalizeOrderProducts,
    })
    current = { ...formLogic, ...formData }
    return null
}

const render = async (updates = {}) => {
    props = { ...props, ...updates }
    await act(async () => root.render(<MemoryRouter><Harness {...props} /></MemoryRouter>))
}

const editDescription = async (description = 'Edited description') => {
    await act(async () => current.onChange('description')({ target: { value: description } }))
}

const submit = async () => {
    await act(async () => current.onSubmit())
}

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    props = { order: ORDER, orderResources: RESOURCES }
    updateMutation = { mutateAsync: vi.fn().mockResolvedValue({ id: ORDER.id }) }
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

describe('historical warehouse preservation during order edits', () => {
    it('preserves an archived warehouse by omitting it from an unrelated update', async () => {
        await render()

        expect(current.form.warehouse).toEqual(ARCHIVED_WAREHOUSE)
        expect(current.isDirty).toBe(false)
        await editDescription()
        await submit()

        expect(updateMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
            id: ORDER.id,
            payload: expect.objectContaining({ description: 'Edited description' }),
        })
        expect(updateMutation.mutateAsync.mock.calls[0][0].payload).not.toHaveProperty('warehouse')
    })

    it('keeps the historical warehouse and unsaved edits through reference-data refreshes', async () => {
        await render()
        await editDescription('Unsaved draft')

        await render({ orderResources: { ...RESOURCES, warehouses: [{ ...ACTIVE_WAREHOUSE, name: 'Renamed active warehouse' }] } })

        expect(current.form.warehouse).toEqual(ARCHIVED_WAREHOUSE)
        expect(current.form.description).toBe('Unsaved draft')
        expect(current.isDirty).toBe(true)
        await submit()
        expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
            id: ORDER.id,
            payload: expect.objectContaining({ description: 'Unsaved draft' }),
        })
        expect(updateMutation.mutateAsync.mock.calls[0][0].payload).not.toHaveProperty('warehouse')
    })

    it.each([
        ['a different warehouse', ACTIVE_WAREHOUSE, ACTIVE_WAREHOUSE.id],
        ['no warehouse', null, null],
    ])('saves an explicit selection of %s without restoring the original warehouse', async (_label, warehouse, expectedId) => {
        await render()
        await act(async () => current.setForm((previous) => ({ ...previous, warehouse })))
        await render({ orderResources: { ...RESOURCES, warehouses: [...RESOURCES.warehouses] } })

        await submit()

        expect(updateMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
            id: ORDER.id,
            payload: expect.objectContaining({ warehouse: expectedId }),
        })
    })

    it('keeps an originally absent warehouse null when saving another field', async () => {
        await render({ order: { ...ORDER, warehouse: null } })
        expect(current.form.warehouse).toBeNull()

        await editDescription()
        await submit()

        expect(updateMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
            id: ORDER.id,
            payload: expect.objectContaining({ warehouse: null, description: 'Edited description' }),
        })
    })
})
