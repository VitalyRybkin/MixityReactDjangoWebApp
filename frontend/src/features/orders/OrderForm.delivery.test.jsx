import { act, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeliveryContext } from './utils/DeliveryContext.js'
import OrderFormPage from './OrderForm.jsx'

const navigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (importOriginal) => ({
    ...await importOriginal(),
    useNavigate: () => navigate,
}))
vi.mock('../../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('../../components/PageHeaderCreateUpdate.jsx', () => ({
    default: ({ saving, saveDisabled }) => <button type="submit" disabled={saving || saveDisabled}>Save</button>,
}))
vi.mock('./components/OrderCustomerFields.jsx', () => ({ default: () => null }))
vi.mock('./components/OrderProductsList.jsx', () => ({ default: () => null }))
vi.mock('./components/OrderMainFields.jsx', () => ({
    default: ({ onChange }) => {
        changeDescription = (value) => onChange('description')({ target: { value } })
        return null
    },
}))
vi.mock('./components/OrderDetailSideBar.jsx', () => ({
    default: function DeliveryEditor() {
        const delivery = useContext(DeliveryContext)
        currentDelivery = delivery.data
        updateDelivery = delivery.update
        return null
    },
}))
vi.mock('./hooks/useUnsavedGuard.js', () => ({
    useUnsavedGuard: () => ({ confirmOpen: false }),
}))
vi.mock('./hooks/useViewUpd.js', () => ({ useViewUpd: () => () => {} }))
vi.mock('./utils/orders.queries.js', () => ({
    useGetOrderResources: () => ({ data: resources, isPending: false }),
    useGetOrder: (_id, { enabled }) => ({ data: enabled ? order : undefined, isPending: false }),
    useCreateOrder: () => ({ mutateAsync: createOrder, isPending: false }),
    useUpdateOrder: () => ({ mutateAsync: updateOrder, isPending: false }),
    useUploadUpd: () => ({ isPending: false }),
}))
vi.mock('../customers/utils/customers.queries.js', () => ({
    useGetCustomerPrices: () => ({ data: [], isSuccess: true, isLoading: false, isFetching: false }),
}))
vi.mock('../warehouses/utils/stocks.queries.js', () => ({
    useGetWarehousePrices: () => ({ data: [], isSuccess: true, isLoading: false, isFetching: false }),
}))

const ORIGINAL_DELIVERY = {
    carrier: 7,
    driver: 11,
    truck: 12,
    delivery_cost: '100.00',
    delivery_compensation: '5.00',
    demurrage: '0.00',
}
const CUSTOMER = { id: 2, name: 'Customer', customer_objects: [], contacts: [] }
let container
let root
let order
let resources
let updateOrder
let createOrder
let changeDescription
let updateDelivery
let currentDelivery

const renderForm = async ({ create = false } = {}) => {
    await act(async () => root.render(
        <MemoryRouter initialEntries={[create ? '/orders/create' : '/orders/42/edit']}>
            <Routes>
                <Route path="/orders/create" element={<OrderFormPage />} />
                <Route path="/orders/:id/edit" element={<OrderFormPage />} />
            </Routes>
        </MemoryRouter>,
    ))
}
const editDescription = async () => {
    await act(async () => changeDescription('Description-only change'))
}
const editDelivery = async (changes) => {
    await act(async () => updateDelivery(changes))
}
const submit = async () => {
    const button = [...container.querySelectorAll('button')].find((element) => element.textContent === 'Save')
    expect(button.disabled).toBe(false)
    await act(async () => button.click())
}
const updatePayload = () => {
    expect(updateOrder).toHaveBeenCalledTimes(1)
    expect(updateOrder.mock.calls[0][0].id).toBe('42')
    expect(navigate).toHaveBeenCalledWith('/')
    return updateOrder.mock.calls[0][0].payload
}

beforeEach(() => {
    navigate.mockReset()
    updateOrder = vi.fn().mockResolvedValue({ id: 42 })
    createOrder = vi.fn().mockResolvedValue({ id: 43 })
    order = {
        id: 42,
        client: { id: 1, name: 'Supplier' },
        customer: CUSTOMER,
        warehouse: null,
        description: 'Original description',
        order_products: [],
        order_delivery: { ...ORIGINAL_DELIVERY },
    }
    resources = { customers: [CUSTOMER], warehouses: [], products: [], pack_types: [], clients: [] }
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

describe('order saves with an archived delivery carrier', () => {
    it.each(['order_delivery', 'delivery'])('omits unchanged delivery on a description-only save using %s', async (field) => {
        const original = order.order_delivery
        delete order.order_delivery
        order[field] = original
        await renderForm()
        expect(currentDelivery.carrier).toBe(7)

        await editDescription()
        await submit()

        expect(updatePayload()).toMatchObject({ description: 'Description-only change' })
        expect(updatePayload()).not.toHaveProperty('delivery')
        expect(order[field]).toEqual(ORIGINAL_DELIVERY)
    })

    it('updates a delivery cost without resending the unchanged archived carrier or other relations', async () => {
        await renderForm()
        await editDelivery({ delivery_cost: 125 })
        await submit()

        expect(updatePayload().delivery).toEqual({ delivery_cost: 125 })
    })

    it('normalizes equivalent relation objects without adding unchanged IDs to PATCH', async () => {
        await renderForm()
        await editDelivery({ carrier: { id: '7', name: 'Archived carrier' }, driver: { id: 11 }, truck: { id: '12' } })
        await editDescription()
        await submit()

        expect(updatePayload()).not.toHaveProperty('delivery')
    })

    it('submits an explicit replacement carrier and clears its previous driver and truck', async () => {
        await renderForm()
        await editDelivery({ carrier: { id: 8, name: 'Active carrier' }, driver: null, truck: null })
        await submit()

        expect(updatePayload().delivery).toEqual({ carrier: 8, driver: null, truck: null })
    })

    it('submits explicit clearing of the existing carrier, driver and truck', async () => {
        await renderForm()
        await editDelivery({ carrier: null, driver: null, truck: null })
        await submit()

        expect(updatePayload().delivery).toEqual({ carrier: null, driver: null, truck: null })
    })

    it('keeps the saved carrier and pending description change through a resource refresh', async () => {
        await renderForm()
        await editDescription()
        resources = { ...resources, warehouses: [{ id: 9, name: 'New warehouse' }] }
        await renderForm()
        expect(currentDelivery.carrier).toBe(7)

        await submit()

        expect(updatePayload()).toMatchObject({ description: 'Description-only change' })
        expect(updatePayload()).not.toHaveProperty('delivery')
    })

    it('continues submitting complete normalized delivery data when creating an order', async () => {
        await renderForm({ create: true })
        await editDelivery({ carrier: { id: 8 }, driver: { id: 21 }, truck: { id: 22 }, delivery_cost: 125 })
        await submit()

        expect(updateOrder).not.toHaveBeenCalled()
        expect(createOrder).toHaveBeenCalledTimes(1)
        expect(createOrder.mock.calls[0][0].delivery).toEqual({
            carrier: 8,
            driver: 21,
            truck: 22,
            delivery_cost: 125,
            delivery_compensation: '',
            demurrage: '',
        })
        expect(navigate).toHaveBeenCalledWith('/')
    })
})
