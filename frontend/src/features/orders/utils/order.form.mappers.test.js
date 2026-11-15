import { describe, expect, it } from 'vitest'

import { mapOrderToForm, toOrderPayload } from './order.form.mappers.js'

const archivedWarehouse = { id: 3, name: 'Archived warehouse' }
const activeWarehouse = { id: 4, name: 'Active warehouse' }
const resources = { warehouses: [activeWarehouse] }

describe('historical warehouse references', () => {
    it.each([archivedWarehouse, 3, '3'])('preserves an archived reference from order details: %j', (warehouse) => {
        const order = { id: 10, warehouse, description: 'Original' }
        const form = mapOrderToForm(order, resources)

        expect(String(form.warehouse.id)).toBe('3')
        expect(form.warehouse.name).toBeTruthy()
        const payload = toOrderPayload({ ...form, description: 'Edited' }, order)
        expect(payload.description).toBe('Edited')
        expect(payload).not.toHaveProperty('warehouse')
        expect(order.warehouse).toBe(warehouse)
        expect(resources.warehouses).toEqual([activeWarehouse])
    })

    it('prefers the current active reference and omits its unchanged ID on PATCH', () => {
        const order = { warehouse: { id: '4', name: 'Old name' } }
        const form = mapOrderToForm(order, resources)

        expect(form.warehouse).toBe(activeWarehouse)
        expect(toOrderPayload(form, order)).not.toHaveProperty('warehouse')
    })

    it('includes a warehouse when creating an order', () => {
        expect(toOrderPayload({ warehouse: activeWarehouse }).warehouse).toBe(4)
    })

    it('serializes an explicit replacement or clear of the archived reference', () => {
        const order = { warehouse: archivedWarehouse }
        const form = mapOrderToForm(order, resources)

        expect(toOrderPayload({ ...form, warehouse: activeWarehouse }, order).warehouse).toBe(4)
        expect(toOrderPayload({ ...form, warehouse: null }, order).warehouse).toBeNull()
    })

    it('does not assign a warehouse to an order that has none', () => {
        const order = { warehouse: null }
        const form = mapOrderToForm(order, resources)

        expect(form.warehouse).toBeNull()
        expect(toOrderPayload(form, order).warehouse).toBeNull()
    })
})
