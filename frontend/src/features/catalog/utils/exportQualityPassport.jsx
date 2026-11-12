import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import html2pdf from 'html2pdf.js'

import QualityPassportTemplate from '../components/QualityPassportTemplate.jsx'

// Имя файла строим по данным паспорта, а не по названию в шапке.
function safeFilenamePart(value, fallback) {
    const cleaned = String(value ?? '')
        .trim()
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^[. _]+|[. _]+$/g, '')

    return (cleaned || fallback).slice(0, 80)
}

function passportDateForFilename(value) {
    const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
    return match
        ? `${match[3]}.${match[2]}.${match[1]}`
        : safeFilenamePart(value, 'без_даты')
}

/**
 * Validate complete passport data before rendering a PDF.
 * Used by both catalog and order preview actions.
 */
export function requireCompleteQualityPassport(passport) {
    if (!passport?.id || !Array.isArray(passport.specifications)) {
        throw new Error('INCOMPLETE_PASSPORT_DATA')
    }
    return passport
}

export function qualityPassportPdfFilename(passport) {
    const number = safeFilenamePart(passport.number ?? passport.id, 'без_номера')
    const productName = safeFilenamePart(passport.product?.name, 'без_названия')
    const date = passportDateForFilename(passport.issue_date)

    return `Паспорт_качества_${number}_${productName}_${date}.pdf`
}

/**
 * Generate the quality passport from the JSON returned by
 * GET /api/catalog/quality-passports/{id}/ (the existing detail endpoint).
 *
 * mode: 'download' (default), 'preview', or 'file' (returns {filename, blob}).
 * Call preview synchronously from an onClick handler with passport already loaded
 * to avoid browser popup blockers.
 */
export async function exportQualityPassport(
    passport,
    { mode = 'download', previewWindow: suppliedPreviewWindow = null, fileHandle = null } = {},
) {
    if (!passport?.id) throw new Error('QUALITY_PASSPORT_NOT_LOADED')

    // Open the tab immediately, before awaiting any asynchronous work.
    const previewWindow = mode === 'preview' ? (suppliedPreviewWindow ?? window.open('', '_blank')) : null
    if (mode === 'preview' && !previewWindow) {
        throw new Error('POPUP_BLOCKED')
    }

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '0'
    container.style.top = '0'
    container.style.zIndex = '-1'
    container.style.width = '210mm'
    container.style.background = '#fff'
    container.style.pointerEvents = 'none'

    document.body.appendChild(container)

    const root = createRoot(container)
    let completed = false

    try {
        flushSync(() => {
            root.render(<QualityPassportTemplate passport={passport} />)
        })

        if (document.fonts?.ready) {
            await document.fonts.ready
        }

        const page = container.querySelector('.qp-page')
        if (!page) throw new Error('QUALITY_PASSPORT_TEMPLATE_NOT_FOUND')

        const filename = qualityPassportPdfFilename(passport)
        const options = {
            filename,
            margin: 0,
            image: { type: 'png' },
            html2canvas: {
                scale: 3,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
            },
            pagebreak: { mode: ['css', 'legacy'] },
        }

        const worker = html2pdf().set(options).from(page)
        const pdf = await worker.toPdf().get('pdf')
        pdf.setProperties({
            title: filename.replace(/\.pdf$/i, ''),
            subject: 'Паспорт качества продукции',
        })

        if (mode === 'file') {
            completed = true
            return { filename, blob: pdf.output('blob') }
        }

        if (mode === 'preview') {
            const blob = pdf.output('blob')
            const url = URL.createObjectURL(blob)
            previewWindow.location.href = url
            window.addEventListener('pagehide', () => URL.revokeObjectURL(url), {
                once: true,
            })
        } else if (fileHandle) {
            const writable = await fileHandle.createWritable()
            try {
                await writable.write(pdf.output('blob'))
                await writable.close()
            } catch (error) {
                try {
                    await writable.abort()
                } catch {
                }
                throw error
            }
        } else {
            const blob = pdf.output('blob')
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.style.display = 'none'
            document.body.appendChild(link)
            try {
                link.click()
            } finally {
                link.remove()
                setTimeout(() => URL.revokeObjectURL(url), 60_000)
            }
        }
        completed = true
    } finally {
        root.unmount()
        container.remove()
        if (!completed && previewWindow && !previewWindow.closed) {
            previewWindow.close()
        }
    }
}
