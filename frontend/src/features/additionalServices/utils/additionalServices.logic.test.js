import { describe, expect, it } from 'vitest'
import { amountInCents, formatCents, makeParams, previewTotals, toForm, toPayload, validateForm } from './additionalServices.logic.js'

const row = (overrides = {}) => ({
    category: 'transport', name: 'Манипулятор', quantity: '0.333',
    cost_per_unit: '1.00', price_per_unit: '2.00', is_rebillable: true, ...overrides,
})

const form = (overrides = {}) => ({
    service_date: '2026-11-25', direction: 'site_work', status: 'created',
    customerId: '1', construction_object: '2', rental_contract: '',
    providerType: 'carrier', providerId: '3', description: '', items: [row()], ...overrides,
})

describe('additional services form and filter helpers', () => {
    it('supports grouped multi-select and exact service type filtering', () => {
        expect(makeParams({
            directions: ['delivery', 'site_work'], providers: ['carrier'],
            types: ['site_work_carrier'], compositions: ['transport_only', 'both'],
            itemName: 'манипулятор',
        }, 3)).toMatchObject({
            page: 3, direction: 'delivery,site_work', provider_type: 'carrier',
            service_type: 'site_work_carrier', composition: 'transport_only,both',
            item_name: 'манипулятор',
        })
    })

    it('rounds money per row identically to the backend', () => {
        const totals = previewTotals([row(), row()])
        expect(totals.cost).toBe(66n)
        expect(totals.charge).toBe(134n)
        expect(totals.margin).toBe(68n)
        expect(formatCents(totals.margin)).toBe('0,68 ₽')
        expect(amountInCents(row(), 'price_per_unit')).toBe(67n)
    })

    it('keeps specialist and transport financial totals separate', () => {
        const totals = previewTotals([
            row({ quantity: '2.000', cost_per_unit: '1000.00', price_per_unit: '1500.00' }),
            row({ category: 'specialist', quantity: '1.000', cost_per_unit: '400.00', price_per_unit: '600.00', is_rebillable: false }),
        ])
        expect(totals.by_category.transport.cost).toBe(200000n)
        expect(totals.by_category.specialist.cost).toBe(40000n)
        expect(totals.by_category.specialist.charge).toBe(0n)
    })

    it('rejects specialist rows with Carrier, but does not silently delete them', () => {
        const state = form({ items: [row({ category: 'specialist' })] })
        expect(validateForm(state).join(' ')).toMatch(/Перевозчик/)
        expect(toPayload(state).items).toHaveLength(1)
    })

    it('requires transport for delivery and return even when RepairCompany supplies the work', () => {
        for (const direction of ['delivery', 'return']) {
            const state = form({ providerType: 'repair_company', direction, items: [row({ category: 'specialist' })] })
            expect(validateForm(state).join(' ')).toMatch(/транспортная позиция/)
        }
    })

    it('allows specialist-only site work by RepairCompany', () => {
        expect(validateForm(form({ providerType: 'repair_company', items: [row({ category: 'specialist' })] }))).toEqual([])
    })

    it('keeps a selected archived object and contract when only the description changes', () => {
        const original = {
            id: 91, customer: 5, construction_object: 45, rental_contract: 9,
            carrier: 7, repair_company: null,
            status: 'created', direction: 'site_work', service_date: '2026-11-25',
            description: '', items: [{ id: 19, ...row() }],
        }
        const patch = toPayload({ ...toForm(original), description: 'Перенести силос' }, original)
        expect(patch.construction_object).toBeUndefined()
        expect(patch.rental_contract).toBeUndefined()
        expect(patch.items).toBeUndefined()
        expect(patch.description).toBe('Перенести силос')
    })

    it('sends specialist row removal when changing RepairCompany to Carrier', () => {
        const original = {
            customer: 1, construction_object: 2, rental_contract: null,
            carrier: null, repair_company: 4,
            status: 'created', direction: 'site_work', service_date: '2026-11-25',
            description: '', items: [{ id: 19, ...row({ category: 'specialist' }) }],
        }
        const next = { ...toForm(original), providerType: 'carrier', providerId: '3', items: [row()] }
        const patch = toPayload(next, original)
        expect(patch.carrier).toBe(3)
        expect(patch.repair_company).toBeNull()
        expect(patch.items).toEqual([expect.objectContaining({ category: 'transport' })])
        expect(validateForm(next)).toEqual([])
    })

    it('does not replace unchanged specification or archived relations on PATCH', () => {
        const original = {
            construction_object: 2, rental_contract: 8, carrier: 3, repair_company: null,
            status: 'created', direction: 'site_work', service_date: '2026-11-25',
            description: '', customer: 1,
            items: [{ id: 12, ...row() }],
        }
        const current = toForm(original)
        const patch = toPayload({ ...current, status: 'completed' }, original)
        expect(patch.items).toBeUndefined()
        expect(patch.construction_object).toBeUndefined()
        expect(patch.rental_contract).toBeUndefined()
        expect(patch.carrier).toBeUndefined()
        expect(patch.repair_company).toBeUndefined()
        expect(patch.status).toBe('completed')
    })
})
