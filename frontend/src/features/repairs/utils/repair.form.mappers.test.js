import { describe, expect, it } from 'vitest'

import { getRepairRelationId, toRepairRequestPayload, withCurrentRepairOption } from './repair.form.mappers.js'

const COMPANY = { id: 21, name: 'Archived repair company', is_active: false }
const OBJECT = { id: 31, name: 'Archived construction object', customer: 11, is_active: false }
const ORIGINAL = { id: 42, repair_company: COMPANY, construction_object: OBJECT }
const SPECIFICATIONS = [
    { type: 'part', part: 4, quantity: 2, price: '125.00', is_rebillable: true },
    { type: 'service', service: 6, quantity: 1, price: '500.00', is_rebillable: false },
]
const FORM = {
    id: 42,
    customerId: 11,
    request_date: '2026-11-16',
    closing_date: '',
    status: 'open',
    location: 'site',
    repair_company: 21,
    construction_object: 31,
    description: 'Edited request description',
    inspection_description: 'Inspection findings',
    closing_description: 'Closing notes',
}

const freezeDeep = (value) => {
    if (value && typeof value === 'object') {
        for (const child of Object.values(value)) freezeDeep(child)
        Object.freeze(value)
    }
    return value
}

describe('repair relation IDs', () => {
    it.each([
        ['numeric ID', 21, 21],
        ['string ID', '21', '21'],
        ['numeric object ID', COMPANY, 21],
        ['string object ID', { id: '21', name: 'Company' }, '21'],
        ['an empty selection', '', null],
        ['an absent value', undefined, null],
        ['a cleared value', null, null],
        ['an empty object ID', { id: '' }, null],
    ])('normalizes %s without returning a relation object', (_label, value, expected) => {
        expect(getRepairRelationId(value)).toBe(expected)
    })
})

describe('repair request write payloads', () => {
    it.each([
        ['object details and numeric form IDs', ORIGINAL, { repair_company: 21, construction_object: 31 }],
        ['object details and string form IDs', ORIGINAL, { repair_company: '21', construction_object: '31' }],
        [
            'scalar details and form objects',
            { ...ORIGINAL, repair_company: 21, construction_object: '31' },
            { repair_company: { id: '21' }, construction_object: { id: 31 } },
        ],
        [
            'string object IDs and numeric form IDs',
            { ...ORIGINAL, repair_company: { id: '21' }, construction_object: { id: '31' } },
            { repair_company: 21, construction_object: 31 },
        ],
    ])('omits unchanged archived relations with %s', (_label, original, relations) => {
        const payload = toRepairRequestPayload({ ...FORM, ...relations }, SPECIFICATIONS, original)

        expect(payload).not.toHaveProperty('repair_company')
        expect(payload).not.toHaveProperty('construction_object')
        expect(payload).toEqual({
            request_date: FORM.request_date,
            closing_date: null,
            status: FORM.status,
            location: FORM.location,
            description: FORM.description,
            inspection_description: FORM.inspection_description,
            closing_description: FORM.closing_description,
            specifications: SPECIFICATIONS,
        })
    })

    it.each([
        ['repair_company', { id: 22, name: 'Active repair company' }, 22, 'construction_object'],
        ['construction_object', { id: '32', name: 'Active construction object' }, '32', 'repair_company'],
    ])('includes an explicit %s replacement while omitting the other unchanged relation', (field, value, id, otherField) => {
        const payload = toRepairRequestPayload({ ...FORM, [field]: value }, SPECIFICATIONS, ORIGINAL)

        expect(payload[field]).toBe(id)
        expect(payload).not.toHaveProperty(otherField)
        expect(payload.description).toBe(FORM.description)
        expect(payload.specifications).toEqual(SPECIFICATIONS)
    })

    it.each(['', null, undefined])('sends null for explicitly cleared nonempty relations: %j', (cleared) => {
        const payload = toRepairRequestPayload(
            { ...FORM, repair_company: cleared, construction_object: cleared },
            SPECIFICATIONS,
            ORIGINAL,
        )

        expect(payload).toHaveProperty('repair_company', null)
        expect(payload).toHaveProperty('construction_object', null)
    })

    it.each(['', null, undefined])('omits a company already absent from the saved request: %j', (empty) => {
        const payload = toRepairRequestPayload(
            { ...FORM, repair_company: empty },
            SPECIFICATIONS,
            { ...ORIGINAL, repair_company: null },
        )

        expect(payload).not.toHaveProperty('repair_company')
        expect(payload).not.toHaveProperty('construction_object')
        expect(payload.description).toBe(FORM.description)
    })

    it('includes a newly assigned company when the saved request had none', () => {
        const payload = toRepairRequestPayload(
            { ...FORM, repair_company: { id: 22 } },
            SPECIFICATIONS,
            { ...ORIGINAL, repair_company: null },
        )

        expect(payload.repair_company).toBe(22)
        expect(payload).not.toHaveProperty('construction_object')
    })

    it('includes normalized relation IDs on create and preserves all write fields', () => {
        const form = { ...FORM, repair_company: COMPANY, construction_object: { id: '31' }, closing_date: '2026-11-17' }

        expect(toRepairRequestPayload(form, SPECIFICATIONS)).toEqual({
            request_date: '2026-11-16',
            closing_date: '2026-11-17',
            status: 'open',
            location: 'site',
            repair_company: 21,
            construction_object: '31',
            description: FORM.description,
            inspection_description: FORM.inspection_description,
            closing_description: FORM.closing_description,
            specifications: SPECIFICATIONS,
        })
    })

    it('retains empty create selections as null rather than omitting required relation fields', () => {
        const payload = toRepairRequestPayload(
            { ...FORM, repair_company: '', construction_object: undefined },
            [],
        )

        expect(payload).toHaveProperty('repair_company', null)
        expect(payload).toHaveProperty('construction_object', null)
        expect(payload.specifications).toEqual([])
    })

    it('does not mutate form values, original relations, or specification payloads', () => {
        const form = freezeDeep(structuredClone({ ...FORM, repair_company: COMPANY, construction_object: OBJECT }))
        const original = freezeDeep(structuredClone(ORIGINAL))
        const specifications = freezeDeep(structuredClone(SPECIFICATIONS))
        const before = structuredClone({ form, original, specifications })

        const payload = toRepairRequestPayload(form, specifications, original)

        expect({ form, original, specifications }).toEqual(before)
        expect(payload).not.toBe(form)
        expect(payload).not.toHaveProperty('repair_company')
        expect(payload).not.toHaveProperty('construction_object')
        expect(payload.specifications).toEqual(specifications)
    })
})

describe('historical repair form options', () => {
    it('keeps the saved archived name selectable when active options no longer include it', () => {
        const active = { id: 22, name: 'Active company' }
        const options = withCurrentRepairOption([active], '21', COMPANY, 'Компания')

        expect(options).toHaveLength(2)
        expect(options.find((option) => option.id === '21')).toEqual(expect.objectContaining({
            id: '21',
            name: COMPANY.name,
        }))
        expect(options).toContainEqual(active)
    })

    it('supplies an intelligible fallback name when saved details contain only an ID', () => {
        expect(withCurrentRepairOption([], 31, '31', 'Объект')).toEqual([
            { id: 31, name: 'Объект № 31' },
        ])
    })

    it('prefers a matching active option without duplicating it and aligns its ID with the form value type', () => {
        const active = { id: 21, name: 'Current active name' }
        const options = withCurrentRepairOption([active], '21', COMPANY, 'Компания')

        expect(options).toHaveLength(1)
        expect(options[0]).toEqual({ id: '21', name: 'Current active name' })
        expect(active).toEqual({ id: 21, name: 'Current active name' })
    })

    it.each([
        ['a cleared selection', null, COMPANY],
        ['an empty selection', '', COMPANY],
        ['an absent selection', undefined, COMPANY],
        ['an unrecognized replacement', 22, COMPANY],
        ['a new form with no original relation', 21, null],
    ])('does not invent a historical option for %s', (_label, selected, original) => {
        expect(withCurrentRepairOption([], selected, original, 'Компания')).toEqual([])
    })

    it('does not mutate the active option list or saved relation while adding an archived selection', () => {
        const activeOptions = freezeDeep([{ id: 22, name: 'Active company' }])
        const original = freezeDeep({ ...COMPANY })
        const before = structuredClone({ activeOptions, original })

        const options = withCurrentRepairOption(activeOptions, 21, original, 'Компания')

        expect({ activeOptions, original }).toEqual(before)
        expect(options).not.toBe(activeOptions)
        expect(options).toHaveLength(2)
    })
})
