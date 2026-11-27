import { describe, expect, it } from 'vitest'

import { toForm, toPayload } from './additionalServices.logic.js'

const original = {
    id: 20,
    service_date: '2026-11-27',
    closing_date: null,
    status: 'open',
    direction: 'site_work',
    customer: 5,
    construction_object: 10,
    rental_contract: 8,
    carrier: null,
    repair_company: 4,
    description: '',
    items: [{
        id: 30,
        category: 'specialist',
        service: 15,
        name: 'Выезд специалиста',
        quantity: '1.000',
        cost_per_unit: '100.00',
        price_per_unit: '150.00',
        is_rebillable: true,
    }],
}

describe('shared RepairService for additional specialist rows', () => {
    it('loads a linked service and does not replace unchanged rows on PATCH', () => {
        const form = toForm(original)
        expect(form.items[0].service).toBe('15')
        const patch = toPayload({ ...form, description: 'Описание изменено' }, original)
        expect(patch.items).toBeUndefined()
        expect(patch.description).toBe('Описание изменено')
    })

    it('submits the selected service ID alongside the saved name', () => {
        const form = toForm(original)
        const patch = toPayload({ ...form, items: [{
            ...form.items[0],
            service: '16',
            name: 'Монтаж',
        }] }, original)
        expect(patch.items[0]).toMatchObject({
            category: 'specialist', service: 16, name: 'Монтаж',
        })
    })

    it('preserves legacy free-text specialist entries until explicitly changed', () => {
        const legacy = { ...original, items: [{ ...original.items[0], service: null }] }
        const form = toForm(legacy)
        expect(form.items[0].service).toBe('')
        expect(toPayload({ ...form, description: 'Обновлено' }, legacy).items).toBeUndefined()
    })
})
