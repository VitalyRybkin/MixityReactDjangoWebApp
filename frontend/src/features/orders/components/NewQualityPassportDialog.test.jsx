import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, it, vi } from 'vitest'

import NewQualityPassportDialog from './NewQualityPassportDialog.jsx'

async function withDialog(product, orderQuantity, run, props = {}) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onConfirm = vi.fn()

    try {
        const render = (overrides = {}) =>
            act(async () =>
                root.render(
                    <NewQualityPassportDialog
                        open
                        currentPassport={{ id: 42, number: 54672, batch_number: '29.009', issue_date: '2020-01-01' }}
                        suggestedNextPassportNumber={54680}
                        product={product}
                        deliveryDate="2020-01-02"
                        orderQuantity={orderQuantity}
                        onClose={vi.fn()}
                        onConfirm={onConfirm}
                        {...props}
                        {...overrides}
                    />,
                ),
            )

        await render()

        const dialog = document.querySelector('[role="dialog"]')
        const field = (label) => {
            const element = [...dialog.querySelectorAll('label')].find((item) => item.textContent.startsWith(label))
            return document.getElementById(element.htmlFor)
        }
        const change = (label, value) =>
            act(async () => {
                const input = field(label)
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value)
                input.dispatchEvent(new Event('input', { bubbles: true }))
            })
        const confirm = () =>
            act(async () =>
                [...dialog.querySelectorAll('button')].find((button) => button.textContent === 'Применить').click(),
            )

        await run({ dialog, field, change, confirm, onConfirm, render })
    } finally {
        await act(async () => root.unmount())
        container.remove()
    }
}

it('prefills numeric suggestions and submits manually edited values at fixed batch scale', async () => {
    await withDialog(
        { is_piece_based: false, product_unit: { unit: { title: 'ton' } } },
        '1.00',
        async ({ field, change, confirm, onConfirm }) => {
            expect(field('Паспорт №').value).toBe('54680')
            expect(field('Номер партии').value).toBe('29.010')
            await change('Количество, т', '2.000')
            await change('Паспорт №', '54673.1')
            await change('Номер партии', '28.3401')
            await confirm()
            expect(field('Паспорт №').getAttribute('aria-invalid')).toBe('true')
            expect(field('Номер партии').getAttribute('aria-invalid')).toBe('true')
            expect(onConfirm).not.toHaveBeenCalled()

            await change('Паспорт №', '70001')
            await change('Номер партии', '28,34')
            await confirm()
            expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
                expected_latest_passport_id: 42,
                number: 70001,
                batch_number: '28.340',
                issue_date: '2020-01-02',
                production_date: '2020-01-02',
                quantity: '2.000',
            })
        },
    )
})

it.each([
    { unit: 'ton', isPieceBased: true, orderQuantity: '3', wrongMultiple: '0.075', tooSmall: '0.070', valid: '0.080' },
    {
        unit: 'piece',
        isPieceBased: false,
        orderQuantity: '0.06',
        wrongMultiple: '0.060',
        tooSmall: '0.050',
        valid: '0.075',
    },
])(
    'uses the configured $unit step and preserves the order item minimum',
    async ({ unit, isPieceBased, orderQuantity, wrongMultiple, tooSmall, valid }) => {
        const product = { is_piece_based: isPieceBased, product_unit: { unit: { title: unit }, value: 25 } }

        await withDialog(product, orderQuantity, async ({ dialog, change, confirm, onConfirm }) => {
            await change('Количество, т', wrongMultiple)
            await confirm()
            expect(dialog.textContent).toContain('Количество должно быть кратно')
            expect(onConfirm).not.toHaveBeenCalled()

            await change('Количество, т', tooSmall)
            await confirm()
            expect(dialog.textContent).toContain('Количество паспорта должно быть не меньше')
            expect(onConfirm).not.toHaveBeenCalled()

            await change('Количество, т', valid)
            await confirm()
            expect(onConfirm).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ quantity: valid }))
        })
    },
)

it.each([
    ['missing', undefined],
    ['unsupported', { unit: { title: 'kg' }, value: 25 }],
    ['piece without a weight', { unit: { title: 'piece' } }],
])('blocks submission with %s unit configuration', async (_description, config) => {
    await withDialog(
        { is_piece_based: false, product_unit: config },
        '1.00',
        async ({ dialog, change, confirm, onConfirm }) => {
            await change('Количество, т', '2.000')
            await confirm()
            expect(dialog.textContent).toContain('Не удалось определить вес единицы продукции.')
            expect(onConfirm).not.toHaveBeenCalled()
        },
    )
})

it('keeps prepared values and allows retrying with the refreshed global number', async () => {
    const product = { is_piece_based: false, product_unit: { unit: { title: 'ton' } } }
    const initialValue = {
        expected_latest_passport_id: 42,
        number: 54679,
        suggested_next_passport_number: 54679,
        batch_number: '30.125',
        issue_date: '2020-01-02',
        production_date: '2020-01-02',
        quantity: '2.000',
    }
    await withDialog(
        product,
        '1.00',
        async ({ dialog, field, change, confirm, onConfirm, render }) => {
            expect(field('Паспорт №').value).toBe('54679')
            expect(field('Номер партии').value).toBe('30.125')
            expect(dialog.textContent).toContain('Предложенный номер: 54680')
            await change('Паспорт №', '54680')
            await render({ suggestedNextPassportNumber: 54681 })
            expect(field('Паспорт №').value).toBe('54680')
            await confirm()
            expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
                ...initialValue,
                number: 54680,
                suggested_next_passport_number: 54680,
            })
        },
        { initialValue },
    )
})

it('keeps a manually prepared number manual when it happens to match the current suggestion', async () => {
    const product = { is_piece_based: false, product_unit: { unit: { title: 'ton' } } }
    const initialValue = {
        expected_latest_passport_id: 42,
        number: 54680,
        batch_number: '30.125',
        issue_date: '2020-01-02',
        production_date: '2020-01-02',
        quantity: '2.000',
    }
    await withDialog(
        product,
        '1.00',
        async ({ confirm, onConfirm }) => {
            await confirm()
            expect(onConfirm).toHaveBeenCalledExactlyOnceWith(initialValue)
        },
        { initialValue },
    )
})
