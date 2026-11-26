import { describe, expect, it } from 'vitest'

import { emptyForm } from './additionalServices.constants.js'
import { toForm, toPayload, validateForm } from './additionalServices.logic.js'

const original = {
    id: 12,
    service_date: '2026-11-25',
    closing_date: null,
    direction: 'site_work',
    status: 'open',
    customer: 5,
    construction_object: 10,
    rental_contract: 11,
    carrier: 7,
    repair_company: null,
    description: '',
    items: [{
        id: 9,
        category: 'transport',
        name: 'Манипулятор',
        quantity: '1.000',
        cost_per_unit: '100.00',
        price_per_unit: '150.00',
        is_rebillable: true,
    }],
}

describe('additional service status and closing date', () => {
    it('is empty by default and optional', () => {
        expect(emptyForm().closing_date).toBe('')
        expect(toPayload(emptyForm()).closing_date).toBeNull()
        expect(emptyForm().status).toBe('open')
    })

    it('maps an existing null value to the date input', () => {
        expect(toForm(original).closing_date).toBe('')
        expect(toForm({ ...original, status: 'closed', closing_date: '2026-11-26' }).closing_date).toBe('2026-11-26')
    })

    it('sends date-only patch without replacing unchanged specification', () => {
        const value = { ...toForm(original), status: 'closed', closing_date: '2026-11-27' }
        const patch = toPayload(value, original)
        expect(patch.closing_date).toBe('2026-11-27')
        expect(patch.items).toBeUndefined()
        expect(patch.construction_object).toBeUndefined()
        expect(patch.rental_contract).toBeUndefined()
    })

    it('omits unchanged date but sends an explicit clear', () => {
        const withDate = { ...original, status: 'closed', closing_date: '2026-11-27' }
        expect(toPayload(toForm(withDate), withDate)).not.toHaveProperty('closing_date')
        expect(toPayload({ ...toForm(withDate), status: 'open', closing_date: '' }, withDate).closing_date).toBeNull()
    })
})

it('blocks inconsistent status and closing date in the form', () => {
    const valid = { ...toForm(original), status: 'closed', closing_date: '2026-11-26' }
    expect(validateForm(valid).join(' ')).not.toMatch(/дата закрытия|Дата закрытия/)
    expect(validateForm({ ...valid, closing_date: '' }).join(' ')).toMatch(/дату закрытия/)
    expect(validateForm({ ...valid, status: 'open' }).join(' ')).toMatch(/Дата закрытия/)
})
