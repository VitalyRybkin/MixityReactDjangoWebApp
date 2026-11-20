import { describe, expect, it } from 'vitest'

import { toDeliveryPayload } from './order.form.mappers.js'

const archivedCarrier = { id: 7, name: 'Archived carrier', is_active: false }
const archivedDriver = { id: 8, fullName: 'Archived driver', is_active: false }
const archivedTruck = { id: 9, licensePlate: 'А123АА', is_active: false }
const originalDelivery = {
    carrier: archivedCarrier,
    driver: archivedDriver,
    truck: archivedTruck,
    delivery_cost: '100.00',
    delivery_compensation: '0.00',
    demurrage: '25.50',
}

describe('delivery PATCH payloads with historical relations', () => {
    it('omits an unchanged delivery with scalar, object, or string relation IDs', () => {
        for (const relations of [
            { carrier: 7, driver: 8, truck: 9 },
            { carrier: '7', driver: '8', truck: '9' },
            { carrier: { id: '7' }, driver: { id: 8 }, truck: { id: '9' } },
        ]) {
            const delivery = { ...originalDelivery, ...relations }

            expect(toDeliveryPayload(delivery, originalDelivery)).toBeUndefined()
            expect(toDeliveryPayload(originalDelivery, delivery)).toBeUndefined()
            expect(JSON.parse(JSON.stringify({
                description: 'Edited order',
                delivery: toDeliveryPayload(delivery, originalDelivery),
            }))).toEqual({ description: 'Edited order' })
        }
    })

    it('sends a changed delivery cost without resubmitting archived relations', () => {
        const delivery = { ...originalDelivery, delivery_cost: '150.00' }

        expect(toDeliveryPayload(delivery, originalDelivery)).toEqual({ delivery_cost: '150.00' })
    })

    it('includes an explicitly replaced or cleared carrier', () => {
        expect(toDeliveryPayload({ ...originalDelivery, carrier: { id: 17 } }, originalDelivery))
            .toEqual({ carrier: 17 })
        expect(toDeliveryPayload({ ...originalDelivery, carrier: null }, originalDelivery))
            .toEqual({ carrier: null })
    })

    it('includes changed drivers and trucks without resending the unchanged carrier', () => {
        expect(toDeliveryPayload({ ...originalDelivery, driver: { id: '18' } }, originalDelivery))
            .toEqual({ driver: '18' })
        expect(toDeliveryPayload({ ...originalDelivery, truck: 19 }, originalDelivery))
            .toEqual({ truck: 19 })
        expect(toDeliveryPayload({ ...originalDelivery, driver: null, truck: null }, originalDelivery))
            .toEqual({ driver: null, truck: null })
    })

    it('recognizes equivalent numeric and string monetary values, including zero', () => {
        const delivery = {
            ...originalDelivery,
            delivery_cost: 100,
            delivery_compensation: 0,
            demurrage: 25.5,
        }

        expect(toDeliveryPayload(delivery, originalDelivery)).toBeUndefined()
        expect(toDeliveryPayload(originalDelivery, delivery)).toBeUndefined()
    })

    it('sends the complete normalized delivery when creating an order without an original', () => {
        const expected = { ...originalDelivery, carrier: 7, driver: 8, truck: 9 }

        expect(toDeliveryPayload(originalDelivery)).toEqual(expected)
        expect(toDeliveryPayload(originalDelivery, null)).toEqual(expected)
        expect(toDeliveryPayload(null)).toBeNull()
    })

    it('keeps absent relations null on creation and omitted from unrelated partial updates', () => {
        const delivery = {
            carrier: null,
            driver: null,
            truck: null,
            delivery_cost: null,
            delivery_compensation: null,
            demurrage: null,
        }

        expect(toDeliveryPayload(delivery)).toEqual(delivery)
        expect(toDeliveryPayload({ ...delivery, delivery_cost: '50.00' }, delivery))
            .toEqual({ delivery_cost: '50.00' })
        expect(toDeliveryPayload({ ...delivery, delivery_cost: '', demurrage: '' }, delivery))
            .toBeUndefined()
    })

    it('leaves both input deliveries and their nested relation objects unchanged', () => {
        const original = Object.freeze({
            ...originalDelivery,
            carrier: Object.freeze({ ...archivedCarrier }),
            driver: Object.freeze({ ...archivedDriver }),
            truck: Object.freeze({ ...archivedTruck }),
        })
        const delivery = Object.freeze({
            ...original,
            carrier: Object.freeze({ id: '7', name: 'Historical carrier label' }),
            delivery_cost: '150.00',
        })
        const beforeOriginal = structuredClone(original)
        const beforeDelivery = structuredClone(delivery)

        expect(toDeliveryPayload(delivery, original)).toEqual({ delivery_cost: '150.00' })
        expect(original).toEqual(beforeOriginal)
        expect(delivery).toEqual(beforeDelivery)
        expect(delivery.driver).toBe(original.driver)
        expect(delivery.truck).toBe(original.truck)
    })
})
