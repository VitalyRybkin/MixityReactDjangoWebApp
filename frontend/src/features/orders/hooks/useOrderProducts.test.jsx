import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFormLogic } from '../../../hooks/useEntityForm.js'

import { useOrderProducts } from './useOrderProducts.js'

let container
let root
let current

function Harness() {
    current = useOrderProducts()
    return null
}

function SubmitHarness({ createMutation }) {
    const products = useOrderProducts()
    const form = useFormLogic({
        isEdit: false,
        emptyForm: {},
        createMutation,
        redirectPath: '/',
        validate: products.validate,
        toPayload: () => ({ products: products.buildProductsPayload() }),
    })
    current = { ...products, onSubmit: form.onSubmit }
    return null
}

const validRow = (overrides = {}) => ({
    id: 'row-1',
    productId: 1,
    quantity: '2',
    packId: '',
    price_at_sale: 125.5,
    price_at_purchase: 100,
    ...overrides,
})

const setRows = async (rows) => {
    await act(async () => current.setOrderProducts(rows))
}

const validate = async () => {
    let result
    await act(async () => {
        result = current.validate()
    })
    return result
}

beforeEach(async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root.render(<Harness />))
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

describe('order product prices', () => {
    it('keeps missing persisted prices distinct from explicit zero and decimal prices', () => {
        const values = [null, undefined, '', '   ', NaN, Infinity, 'invalid', 0, '0.00', '125.50', 42.75]
        const items = values.map((value, index) => ({
            id: index + 1,
            product: { id: index + 1 },
            piece_based_quantity: 2,
            price_at_sale: value,
            price_at_purchase: value,
        }))

        const normalized = current.normalizeOrderProducts(items)
        const expectedPrices = [null, null, null, null, null, null, null, 0, 0, 125.5, 42.75]

        expect(normalized.map((row) => row.price_at_sale)).toEqual(expectedPrices)
        expect(normalized.map((row) => row.price_at_purchase)).toEqual(expectedPrices)
    })

    it('does not manufacture zero prices when building the save payload', async () => {
        await setRows([
            validRow({ price_at_sale: null, price_at_purchase: NaN }),
            validRow({ id: 'row-2', productId: 2, price_at_sale: 0, price_at_purchase: '125.50' }),
        ])

        expect(current.buildProductsPayload()).toEqual([
            { product: 1, quantity: '2', package: null, price_at_sale: null, price_at_purchase: null },
            { product: 2, quantity: '2', package: null, price_at_sale: 0, price_at_purchase: 125.5 },
        ])
    })

    it.each([
        ['missing sale', 'price_at_sale', null],
        ['missing purchase', 'price_at_purchase', undefined],
        ['empty sale', 'price_at_sale', ''],
        ['blank purchase', 'price_at_purchase', '   '],
        ['nonfinite sale', 'price_at_sale', NaN],
        ['nonfinite purchase', 'price_at_purchase', Infinity],
        ['nonnumeric sale', 'price_at_sale', 'invalid'],
        ['nonnumeric purchase', 'price_at_purchase', 'invalid'],
    ])('blocks saving a selected product with %s price data', async (_label, field, value) => {
        await setRows([validRow({ [field]: value })])

        expect(await validate()).toBe(false)
    })

    it('accepts explicit zero and valid decimal prices on both sides', async () => {
        await setRows([
            validRow({ price_at_sale: 0, price_at_purchase: '12.34' }),
            validRow({ id: 'row-2', productId: 2, price_at_sale: '56.78', price_at_purchase: 0 }),
        ])

        expect(await validate()).toBe(true)
    })

    it('continues to reject a missing quantity and accepts the row after it is filled', async () => {
        await setRows([validRow({ quantity: '' })])

        expect(await validate()).toBe(false)
        expect(current.productErrors['row-1']).toBeTruthy()

        await act(async () => current.handleChange('row-1', { quantity: '2' }))

        expect(await validate()).toBe(true)
        expect(current.productErrors['row-1']).toBeUndefined()
    })

    it('ignores an empty row without a selected product', async () => {
        await setRows([validRow({ productId: '', quantity: '', price_at_sale: null, price_at_purchase: null })])

        expect(await validate()).toBe(true)
        expect(current.buildProductsPayload()).toEqual([])
    })

    it('prevents the save mutation for missing prices and submits explicit zero prices', async () => {
        const createMutation = { mutateAsync: vi.fn().mockResolvedValue({ id: 1 }) }
        await act(async () => {
            root.render(<MemoryRouter><SubmitHarness createMutation={createMutation} /></MemoryRouter>)
        })
        await setRows([validRow({ price_at_sale: null, price_at_purchase: 0 })])

        await act(async () => current.onSubmit())

        expect(createMutation.mutateAsync).not.toHaveBeenCalled()

        await setRows([validRow({ price_at_sale: 0, price_at_purchase: 0 })])
        await act(async () => current.onSubmit())

        expect(createMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
            products: [{ product: 1, quantity: '2', package: null, price_at_sale: 0, price_at_purchase: 0 }],
        })
    })
})

it('blocks duplicate prepared passport numbers before the save mutation and ignores historical assignments', async () => {
    const createMutation = { mutateAsync: vi.fn().mockResolvedValue({ id: 1 }) }
    await act(async () => {
        root.render(<MemoryRouter><SubmitHarness createMutation={createMutation} /></MemoryRouter>)
    })
    await setRows([
        validRow({ quality_passport: { number: 546 }, new_quality_passport: { number: 545 } }),
        validRow({ id: 'row-2', productId: 2, new_quality_passport: { number: '0545' } }),
    ])
    await act(async () => current.onSubmit())
    expect(createMutation.mutateAsync).not.toHaveBeenCalled()
    expect(Object.keys(current.passportNumberErrors)).toEqual(['row-1', 'row-2'])

    await act(async () => current.handleChange('row-2', { new_quality_passport: { number: 546 } }))
    await act(async () => current.onSubmit())
    expect(createMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
        products: expect.arrayContaining([
            expect.objectContaining({ product: 1, new_quality_passport: { number: 545 } }),
            expect.objectContaining({ product: 2, new_quality_passport: { number: 546 } }),
        ]),
    })
})
