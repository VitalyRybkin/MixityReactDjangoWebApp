import { describe, expect, it } from 'vitest'

import { emptyItem } from './additionalServices.constants.js'
import { toForm, toPayload, validateForm } from './additionalServices.logic.js'

const saved = {
    id: 22, service_date: '2026-11-27', closing_date: null,
    status: 'open', direction: 'delivery', customer: 4,
    construction_object: 10, rental_contract: 8,
    carrier: 3, repair_company: null, description: '',
    items: [{
        id: 33, category: 'transport', transport_service: 51,
        service: null, name: 'Манипулятор', quantity: '1.000',
        cost_per_unit: '200.00', price_per_unit: '300.00', is_rebillable: true,
    }],
}

describe('transport catalog references in Additional Services', () => {
    it('keeps the transport FK and unchanged specification on a description-only PATCH', () => {
        const form = toForm(saved)
        expect(form.items[0].transport_service).toBe('51')
        const payload = toPayload({ ...form, description: 'Уточнение' }, saved)
        expect(payload.items).toBeUndefined()
        expect(payload.description).toBe('Уточнение')
    })

    it('sends transport service and saved name when changing the selected catalog entry', () => {
        const form = toForm(saved)
        const payload = toPayload({
            ...form,
            items: [{ ...form.items[0], transport_service: '52', name: 'Автокран' }],
        }, saved)
        expect(payload.items[0]).toMatchObject({
            category: 'transport', transport_service: 52, name: 'Автокран',
        })
        expect(payload.items[0].service).toBeUndefined()
    })

    it('preserves legacy free-text transport rows during unrelated changes', () => {
        const legacy = {
            ...saved,
            items: [{ ...saved.items[0], transport_service: null, name: 'Старая перевозка' }],
        }
        const form = toForm(legacy)
        expect(form.items[0].transport_service).toBe('')
        expect(toPayload({ ...form, description: 'Исправлено' }, legacy).items).toBeUndefined()
        expect(validateForm(form)).toEqual([])
    })

    it('requires selection from the transport catalog for new rows', () => {
        const form = toForm({ ...saved, items: [] })
        const row = { ...emptyItem('transport'), name: 'Текст без справочника' }
        expect(validateForm({ ...form, items: [row] }).join(' '))
            .toContain('выберите транспортную услугу из справочника')
        expect(validateForm({ ...form, items: [{
            ...row, transport_service: '77', name: 'Доставка',
        }] })).toEqual([])
    })
})
