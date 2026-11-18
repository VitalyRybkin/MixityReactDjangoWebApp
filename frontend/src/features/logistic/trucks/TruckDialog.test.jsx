import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import TruckDialog from './TruckDialog.jsx'

vi.mock('./TruckCapacityDialogForm.jsx', () => ({ default: () => null }))
vi.mock('./TruckTypeDialogForm.jsx', () => ({ default: () => null }))
vi.mock('./utils/trucks.queries.js', () => ({
    useGetTruckTypes: () => ({ data: [{ id: 1, truckType: 'Truck' }], isPending: false }),
    useGetTruckCapacities: () => ({ data: [{ id: 2, capacity: '20.0' }], isPending: false }),
    useCreateTruck: () => ({ mutateAsync: createTruck, isPending: false }),
    useUpdateTruck: () => ({ mutateAsync: updateTruck, isPending: false }),
}))

let container
let root
let createTruck
let updateTruck
let onSaved

const renderTruck = async (licensePlate) => {
    const initialData = { id: 19, truckType: { id: 1 }, capacity: { id: 2 }, licensePlate, description: 'Saved note' }
    await act(async () => root.render(
        <TruckDialog open mode="edit" carrierId="7" initialData={initialData} onClose={() => {}} onSaved={onSaved} />,
    ))
}
const submit = async () => {
    const form = document.querySelector('#truck-dialog-form')
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
}
const plateInput = () => {
    const label = [...document.querySelectorAll('label')].find((element) => element.textContent.startsWith('Госномер'))
    return document.getElementById(label.htmlFor)
}
const expectSavedPlate = () => {
    expect(createTruck).not.toHaveBeenCalled()
    expect(updateTruck).toHaveBeenCalledExactlyOnceWith({
        id: 19,
        payload: { carrier: 7, truckType: 1, capacity: 2, licensePlate: 'А123АА77', description: 'Saved note' },
    })
    expect(onSaved).toHaveBeenCalledExactlyOnceWith({ id: 19 })
}

beforeEach(() => {
    createTruck = vi.fn()
    updateTruck = vi.fn().mockResolvedValue({ id: 19 })
    onSaved = vi.fn()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

it.each([
    ['lowercase letters and spaces', ' а123 аа77 '],
    ['hyphens', 'а-123-аа-77'],
    ['tabs and line breaks', 'а\t123\nаа\r77'],
    ['Unicode whitespace', '\uFEFFа\u00A0123\u2003аа77'],
    ['an already normalized plate', 'А123АА77'],
])('keeps plate normalization unchanged for %s when saving', async (_description, plate) => {
    await renderTruck(plate)

    await submit()

    expectSavedPlate()
})

it('uppercases and removes spaces and hyphens during typing as well as submission', async () => {
    await renderTruck('А123АА77')
    const input = plateInput()
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set

    await act(async () => setter.call(input, 'а-123\u00A0аа\t77'))
    await act(async () => input.dispatchEvent(new Event('input', { bubbles: true })))

    expect(input.value).toBe('А123АА77')
    await submit()
    expectSavedPlate()
})
