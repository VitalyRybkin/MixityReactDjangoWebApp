// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ReferenceItemCreateDialog from './ReferenceItemCreateDialog.jsx'

let container
let root

const getDialog = () => document.querySelector('[role="dialog"]')

const getButton = (name) => {
    const dialog = getDialog()
    return Array.from(dialog?.querySelectorAll('button') ?? []).find(
        (button) => button.textContent.trim() === name,
    )
}

async function renderDialog(props) {
    await act(async () => {
        root.render(
            <ReferenceItemCreateDialog
                open
                title="Добавить услугу"
                label="Наименование услуги"
                onClose={vi.fn()}
                {...props}
            />,
        )
    })
}

// Use the native setter so React's controlled-input tracker receives an input event.
async function enterName(value) {
    const input = getDialog()?.querySelector('input')
    expect(input).not.toBeNull()
    const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
    ).set

    await act(async () => {
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
    await act(async () => {
        root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
})

describe('ReferenceItemCreateDialog', () => {
    it('submits a trimmed name and returns the created record', async () => {
        const created = { id: 7, name: 'Монтаж' }
        const onCreate = vi.fn().mockResolvedValue(created)
        const onCreated = vi.fn()

        await renderDialog({ onCreate, onCreated })
        await enterName('  Монтаж  ')

        const saveButton = getButton('Сохранить')
        expect(saveButton).toBeDefined()
        expect(saveButton.disabled).toBe(false)

        await act(async () => {
            saveButton.click()
        })

        expect(onCreate).toHaveBeenCalledExactlyOnceWith('Монтаж')
        expect(onCreated).toHaveBeenCalledExactlyOnceWith(created)
    })

    it('disables submission and closing while saving', async () => {
        const onClose = vi.fn()
        const onCreate = vi.fn()
        await renderDialog({
            saving: true,
            onCreate,
            onCreated: vi.fn(),
            onClose,
        })

        const saveButton = getButton('Сохранение...')
        const cancelButton = getButton('Отмена')

        expect(saveButton).toBeDefined()
        expect(cancelButton).toBeDefined()
        expect(saveButton.disabled).toBe(true)
        expect(cancelButton.disabled).toBe(true)
        expect(onCreate).not.toHaveBeenCalled()
        expect(onClose).not.toHaveBeenCalled()
    })
})
