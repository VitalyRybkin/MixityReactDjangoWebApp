import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { DeliveryContext } from '../utils/DeliveryContext.js'

import OrderDetailSideBar from './OrderDetailSideBar.jsx'

vi.mock('./OrderDeliveryDetail.jsx', () => ({ default: () => null }))

const ARCHIVED = { id: '99', name: 'Архивный склад' }
const ACTIVE = [{ id: 1, name: 'Активный склад' }, { id: 2, name: 'Другой склад' }]
const RESOURCES = { warehouses: ACTIVE, products: [] }
const EMPTY = []
const DELIVERY = { data: {} }

let container
let root
let currentForm

function Harness() {
    const [form, setForm] = useState({ warehouse: ARCHIVED })
    currentForm = form
    return (
        <DeliveryContext.Provider value={DELIVERY}>
            <OrderDetailSideBar
                isEdit
                open
                setOpen={() => {}}
                customerPrices={EMPTY}
                warehousePrices={EMPTY}
                orderProducts={EMPTY}
                setOrderProducts={() => {}}
                orderResources={RESOURCES}
                form={form}
                setForm={setForm}
            />
        </DeliveryContext.Provider>
    )
}

const warehouseInput = () => container.querySelector('input[role="combobox"]')
const options = () => [...document.querySelectorAll('[role="option"]')]

const openWarehouses = async () => {
    const input = warehouseInput()
    await act(async () => {
        input.focus()
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
}

beforeEach(async () => {
    // Popper needs a laid-out anchor; jsdom normally reports an empty rectangle.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 36, width: 200, height: 36,
        toJSON: () => ({}),
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root.render(<Harness />))
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
})

it('keeps the current archived warehouse displayed and selectable beside active warehouses', async () => {
    expect(warehouseInput().value).toBe(ARCHIVED.name)

    await openWarehouses()

    expect(options().map((option) => option.textContent).sort()).toEqual(
        [...ACTIVE.map((item) => item.name), ARCHIVED.name].sort(),
    )
    const selected = options().find((option) => option.textContent === ARCHIVED.name)
    expect(selected.getAttribute('aria-selected')).toBe('true')
    expect(currentForm.warehouse).toBe(ARCHIVED)
})

it('supports explicitly replacing and clearing the historical warehouse', async () => {
    await openWarehouses()
    const replacement = options().find((option) => option.textContent === ACTIVE[0].name)

    await act(async () => replacement.click())

    expect(currentForm.warehouse).toEqual(ACTIVE[0])
    expect(warehouseInput().value).toBe(ACTIVE[0].name)
    await openWarehouses()
    expect(options().map((option) => option.textContent)).toEqual(ACTIVE.map((item) => item.name))

    const clear = container.querySelector('button[aria-label="Clear"]')
    await act(async () => clear.click())

    expect(currentForm.warehouse).toBeNull()
    expect(warehouseInput().value).toBe('')
})
