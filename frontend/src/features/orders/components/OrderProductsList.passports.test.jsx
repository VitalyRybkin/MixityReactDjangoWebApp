import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import api from '../../../api.js'
import { MAX_PASSPORT_NUMBER } from '../../../utils/qualityPassportNumbers.js'
import { useOrderProducts } from '../hooks/useOrderProducts.js'
import { qualityPassportKeys } from '../utils/qualityPassports.queries.js'

import OrderProductsList from './OrderProductsList.jsx'

vi.mock('../../../api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('./OrderPassportPreviewAction.jsx', () => ({ default: () => null }))

const products = ['SG', 'EP', 'Third'].map((name, index) => ({
    id: index + 1,
    name,
    is_piece_based: false,
    product_unit: { value: 1, unit: { title: 'ton', display_name: 'т', is_weight_based: true } },
}))

const batches = ['12.432', '28.999', '29.009']
let client
let container
let root
let order
let globalSuggestion

function Harness() {
    order = useOrderProducts(products)
    return (
        <OrderProductsList
            rows={order.orderProducts}
            productErrors={order.productErrors}
            passportNumberErrors={order.passportNumberErrors}
            productsList={products}
            packsList={[]}
            targetStatus="created"
            deliveryDate="2026-10-31"
            onChange={order.handleChange}
            onRemove={order.handleRemove}
        />
    )
}

const dialog = () => document.querySelector('[role="dialog"]')
const field = (label) => {
    const element = [...dialog().querySelectorAll('label')].find((item) => item.textContent.startsWith(label))
    return document.getElementById(element.htmlFor)
}
const change = (label, value) =>
    act(async () => {
        const input = field(label)
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    })
const clickDialogButton = (label) =>
    act(async () => [...dialog().querySelectorAll('button')].find((button) => button.textContent === label).click())
const renewButtons = () => [
    ...container.querySelectorAll('button[aria-label="Создать паспорт"], button[aria-label="Изменить новый паспорт"]'),
]
const open = async (index) => {
    expect(renewButtons()[index]?.disabled).toBe(false)
    await act(async () => renewButtons()[index].click())
}
const apply = async () => {
    if (!field('Количество, т').value) await change('Количество, т', '3.000')
    await clickDialogButton('Применить')
    expect(dialog()).toBeNull()
}
const numbers = () => order.orderProducts.map((row) => row.new_quality_passport?.number)
const refresh = async (suggestion) => {
    globalSuggestion = suggestion
    await act(async () => client.invalidateQueries({ queryKey: qualityPassportKeys.all }))
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
}

beforeEach(async () => {
    globalSuggestion = 545
    vi.mocked(api.get).mockImplementation(async (_url, { params }) => ({
        data: {
            suggested_next_passport_number: globalSuggestion,
            passport: {
                id: params.product_id,
                number: 541 + params.product_id,
                batch_number: batches[params.product_id - 1],
                issue_date: '2026-10-30',
                quantity: '1.000',
            },
            latest_passport_id: params.product_id,
            is_latest: true,
            can_issue_new_passport: true,
            remaining_quantity: '1.000',
        },
    }))
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () =>
        root.render(
            <QueryClientProvider client={client}>
                <Harness />
            </QueryClientProvider>,
        ),
    )
    await act(async () =>
        order.setOrderProducts(
            products.map(({ id }) => ({
                id,
                productId: id,
                quantity: '2.00',
                packId: '',
                price_at_sale: 10,
                price_at_purchase: 9,
            })),
        ),
    )
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
})

afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    container.remove()
})

it('allocates three distinct numbers in preparation order and increments each product batch', async () => {
    for (const [index, number, batch] of [
        [1, 545, '29.000'],
        [0, 546, '12.433'],
        [2, 547, '29.010'],
    ]) {
        await open(index)
        expect(field('Паспорт №').value).toBe(String(number))
        expect(field('Номер партии').value).toBe(batch)
        await apply()
        expect(order.orderProducts[index].new_quality_passport.suggested_next_passport_number).toBe(number)
    }

    await open(1)
    expect(field('Паспорт №').value).toBe('545')
    expect(dialog().textContent).not.toContain('Предложенный номер:')
    await apply()
    expect(numbers()).toEqual([546, 545, 547])
})

it('skips a far higher manual number and reuses a number released by removing a prepared passport', async () => {
    await open(0)
    await apply()
    await open(0)
    await change('Паспорт №', '70000')
    await apply()

    await open(1)
    expect(field('Паспорт №').value).toBe('545')
    await apply()
    await open(1)
    await clickDialogButton('Удалить')
    await open(2)
    expect(field('Паспорт №').value).toBe('545')
    await apply()
    expect(numbers()).toEqual([70000, undefined, 545])
})

it('keeps open and prepared values stable while the global suggestion advances', async () => {
    await open(0)
    await apply()
    await open(1)
    expect(field('Паспорт №').value).toBe('546')

    await refresh(548)
    expect(field('Паспорт №').value).toBe('546')
    expect(numbers()).toEqual([545, undefined, undefined])
    await apply()

    await open(2)
    expect(field('Паспорт №').value).toBe('548')
    await apply()
    expect(numbers()).toEqual([545, 546, 548])
    await open(0)
    expect(field('Паспорт №').value).toBe('545')
})

it('leaves the suggestion blank when the last valid integer is already prepared', async () => {
    await refresh(MAX_PASSPORT_NUMBER)
    await open(0)
    expect(field('Паспорт №').value).toBe(String(MAX_PASSPORT_NUMBER))
    await apply()
    await open(1)
    expect(field('Паспорт №').value).toBe('')
    await change('Паспорт №', '545')
    await apply()
    expect(numbers()).toEqual([MAX_PASSPORT_NUMBER, 545, undefined])
})

it('identifies both rows with a manually duplicated number', async () => {
    await open(0)
    await apply()
    await open(1)
    await change('Паспорт №', '545')
    await apply()

    const alerts = [...container.querySelectorAll('[role="alert"]')]
    expect(alerts.map((alert) => alert.textContent)).toEqual(
        Array(2).fill('Номер паспорта № 545 уже указан для другого товара в этой заявке.'),
    )
    await open(1)
    await change('Паспорт №', '546')
    await apply()
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0)
})

it('preserves a manual edit in an open dialog when a background refresh fails', async () => {
    await open(0)
    await change('Паспорт №', '70000')
    vi.mocked(api.get).mockRejectedValue(new Error('Refresh failed'))

    await refresh(546)
    expect(field('Паспорт №').value).toBe('70000')
    await apply()
    expect(numbers()).toEqual([70000, undefined, undefined])
})
