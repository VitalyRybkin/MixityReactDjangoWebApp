import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, it } from 'vitest'

import { handlePriceChange } from '../utils/handlePriceChange.js'

import { PriceRow } from './PriceRow.jsx'

let container
let root
let orderProducts

function PriceEditor({ initialPrice, priceType = 'price_at_sale' }) {
    const [rows, setRows] = useState([{ id: 10, productId: 1, [priceType]: initialPrice }])
    const [prices, setPrices] = useState([{ id: 1, product: { id: 1, name: 'Product' }, current_display_price: initialPrice }])
    orderProducts = rows

    return (
        <PriceRow
            item={prices[0]}
            onChange={(id, value) => handlePriceChange({
                id,
                value,
                editablePrices: prices,
                setEditablePrices: setPrices,
                setOrderProducts: setRows,
                priceType,
            })}
        />
    )
}

const renderEditor = async (props) => {
    await act(async () => root.render(<PriceEditor {...props} />))
    return container.querySelector('input')
}

const enterPrice = async (input, value) => {
    await act(async () => {
        input.focus()
        // Bypass React's value tracker to simulate native keyboard input.
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
        setter.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    })
}

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

it('displays a missing price as blank with a validation message', async () => {
    const input = await renderEditor({ initialPrice: null })

    expect(input.value).toBe('')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(container.textContent).toContain('Укажите цену')
})

it.each(['price_at_sale', 'price_at_purchase'])('keeps a cleared %s missing after blur', async (priceType) => {
    const input = await renderEditor({ initialPrice: 150, priceType })

    await enterPrice(input, '')
    await act(async () => input.blur())

    expect(input.value).toBe('')
    expect(orderProducts[0][priceType]).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBe('true')
})

it('accepts an explicitly entered zero and keeps it distinct from an empty price', async () => {
    const input = await renderEditor({ initialPrice: null })

    await enterPrice(input, '0')
    await act(async () => input.blur())

    expect(orderProducts[0].price_at_sale).toBe(0)
    expect(input.value).toBe('0,00')
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(container.textContent).not.toContain('Укажите цену')
})

it('preserves localized decimal entry and two-decimal rounding', async () => {
    const input = await renderEditor({ initialPrice: null })

    await enterPrice(input, '1 234,567')
    await act(async () => input.blur())

    expect(orderProducts[0].price_at_sale).toBe(1234.57)
    expect(input.value.replace(/\s/g, '')).toBe('1234,57')
})

it('invalid text cannot leave the previous price available for saving', async () => {
    const input = await renderEditor({ initialPrice: 150 })

    await enterPrice(input, '12oops')

    expect(orderProducts[0].price_at_sale).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await act(async () => input.blur())
    expect(input.value).toBe('')
})
