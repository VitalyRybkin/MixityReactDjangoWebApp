import { describe, expect, it } from 'vitest'

import { emptyForm, emptyItem } from './additionalServices.constants.js'
import { validateForm } from './additionalServices.logic.js'

describe('additional services initial specification', () => {
    it('starts without any transport or specialist rows', () => {
        const form = emptyForm()
        expect(form.items).toEqual([])
    })

    it('adds the requested category only when the user clicks plus', () => {
        const transport = emptyItem('transport')
        const specialist = emptyItem('specialist')
        expect(transport.category).toBe('transport')
        expect(specialist.category).toBe('specialist')
        expect(transport.service).toBe('')
        expect(specialist.service).toBe('')
    })

    it('still requires at least one item on submission', () => {
        expect(validateForm(emptyForm())).toContain('Добавьте хотя бы одну позицию.')
    })
})
