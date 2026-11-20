import { expect, it, vi } from 'vitest'

import { exportQualityPassport } from './exportQualityPassport.jsx'

const { html2pdf } = vi.hoisted(() => ({ html2pdf: vi.fn() }))
vi.mock('html2pdf.js', () => ({ default: html2pdf }))

it.each(['28.345', '28.340', '29.000'])(
    'renders batch %s and keeps the numeric passport number in the PDF filename',
    async (batch) => {
        const filename = 'Паспорт_качества_54672_Mixity_02.11.2026.pdf'
        const blob = new Blob(['pdf'], { type: 'application/pdf' })
        const pdf = { output: vi.fn(() => blob), setProperties: vi.fn() }
        const worker = {
            set: vi.fn(() => worker),
            from: vi.fn(() => worker),
            toPdf: vi.fn(() => worker),
            get: vi.fn(async () => pdf),
        }
        html2pdf.mockReturnValue(worker)

        const file = await exportQualityPassport(
            {
                id: 42,
                number: 54672,
                product: { name: 'Mixity' },
                issue_date: '2026-11-02',
                batch_number: batch,
                specifications: [],
            },
            { mode: 'file' },
        )

        const [[page]] = worker.from.mock.calls
        expect(page.querySelector('h1').textContent).toBe('ПАСПОРТ КАЧЕСТВА № 54672')
        expect([...page.querySelectorAll('dd')].map((value) => value.textContent)).toContain(batch)
        expect(worker.set).toHaveBeenCalledWith(expect.objectContaining({ filename }))
        expect(file).toEqual({ filename, blob })
    },
)
