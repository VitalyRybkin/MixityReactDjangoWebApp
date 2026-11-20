import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { handlePriceChange } from '../utils/handlePriceChange.js'

import { useEditablePrices } from './useEditablePrices.js'
import { useOrderProducts } from './useOrderProducts.js'

const PRODUCTS = [{ id: 1, name: 'Product A' }, { id: 2, name: 'Product B' }]
const EMPTY_PRICES = []
const reference = (productId, value) => ({
    product: PRODUCTS.find((product) => product.id === productId),
    sale_price: value,
    purchase_price: value,
})
const row = (overrides = {}) => ({ id: 'new-row', productId: 1, quantity: '2', ...overrides })

let container
let root
let current
let props

function Harness({ priceType, prices = EMPTY_PRICES, objectId = 1, isEdit = false }) {
    const productState = useOrderProducts(PRODUCTS)
    const [editablePrices, setEditablePrices] = useState([])

    useEditablePrices({
        isEdit,
        products: PRODUCTS,
        orderProducts: productState.orderProducts,
        objectId,
        prices,
        setEditablePrices,
        productIdsKey: productState.orderProducts.map((item) => item.productId).join(','),
        setOrderProducts: productState.setOrderProducts,
        priceSourceField: priceType === 'price_at_sale' ? 'sale_price' : 'purchase_price',
        orderProductPriceField: priceType,
    })

    current = {
        ...productState,
        editablePrices,
        changePrice: (value) => handlePriceChange({
            id: editablePrices[0].id,
            value,
            editablePrices,
            setEditablePrices,
            setOrderProducts: productState.setOrderProducts,
            priceType,
        }),
    }
    return null
}

const render = async (updates = {}) => {
    props = { ...props, ...updates }
    await act(async () => root.render(<Harness {...props} />))
}

const setRows = async (rows) => {
    await act(async () => current.setOrderProducts(rows))
}

const changePrice = async (value) => {
    await act(async () => current.changePrice(value))
}

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    props = {}
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

describe.each(['price_at_sale', 'price_at_purchase'])('%s editing and automatic references', (priceType) => {
    const expectMissing = () => {
        expect(current.orderProducts[0][priceType]).toBeNull()
        expect(current.editablePrices[0].current_display_price).toBe('')
    }

    it('keeps a cleared automatic price missing through reference and quantity updates', async () => {
        await render({ priceType, prices: [reference(1, 100)] })
        await setRows([row()])
        expect(current.orderProducts[0][priceType]).toBe(100)

        await changePrice(null)
        await render({ prices: [reference(1, 120)] })
        await act(async () => current.handleChange('new-row', { quantity: '3' }))

        expectMissing()
        expect(current.orderProducts[0][`${priceType}_cleared`]).toBe(true)
    })

    it('preserves a user clear made before initial references arrive', async () => {
        await render({ priceType })
        await setRows([row()])
        await changePrice(125)
        await changePrice(null)

        await render({ prices: [reference(1, 150)] })

        expectMissing()
    })

    it('preserves a user clear while a new entity reference is still loading', async () => {
        await render({ priceType, prices: [reference(1, 100)] })
        await setRows([row()])
        await render({ objectId: 2, prices: EMPTY_PRICES })
        expectMissing()
        await changePrice(125)
        await changePrice(null)

        await render({ prices: [reference(1, 200)] })

        expectMissing()
    })

    it('hydrates a replacement product after resetting the previous product clear flag', async () => {
        await render({ priceType, prices: [reference(1, 100), reference(2, 200)] })
        await setRows([row()])
        await changePrice(null)

        await act(async () => current.handleChange('new-row', { productId: 2 }))

        expect(current.orderProducts[0][`${priceType}_cleared`]).toBe(false)
        expect(current.orderProducts[0][priceType]).toBe(200)
        expect(current.editablePrices[0].current_display_price).toBe(200)
    })

    it('preserves a later clear while replacement product references are pending', async () => {
        await render({ priceType, prices: [reference(1, 100)] })
        await setRows([row()])
        await act(async () => current.handleChange('new-row', { productId: 2 }))
        expectMissing()

        await changePrice(null)
        await render({ prices: [reference(1, 100), reference(2, 200)] })

        expectMissing()
    })

    it('keeps an explicit zero authoritative over nonzero references', async () => {
        await render({ priceType, prices: [reference(1, 100)] })
        await setRows([row()])
        await changePrice(0)

        await render({ prices: [reference(1, 200)] })

        expect(current.orderProducts[0][priceType]).toBe(0)
        expect(current.editablePrices[0].current_display_price).toBe(0)
        expect(current.orderProducts[0][`${priceType}_cleared`]).toBe(false)
    })

    it('keeps persisted missing prices blank without borrowing a current reference', async () => {
        await render({ priceType, isEdit: true, prices: [reference(1, 100)] })
        await setRows([row({ id: 7, [priceType]: null })])

        await render({ prices: [reference(1, 200)] })

        expectMissing()
    })

    it.each([
        ['missing', null],
        ['whitespace', '   '],
        ['nonnumeric', 'invalid'],
    ])('does not hydrate %s references as zero on initial load or an entity switch', async (_label, value) => {
        await render({ priceType, prices: [reference(1, value)] })
        await setRows([row({ [priceType]: null })])
        expectMissing()

        await render({ prices: [reference(1, '0.00')] })
        expect(current.orderProducts[0][priceType]).toBe(0)
        expect(current.editablePrices[0].current_display_price).toBe(0)

        await render({ objectId: 2, prices: [reference(1, value)] })
        expectMissing()
    })
})
