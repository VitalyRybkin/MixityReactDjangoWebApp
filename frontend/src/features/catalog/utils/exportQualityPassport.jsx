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
    // Keep the page in the viewport but behind the app. html2canvas can
    // fail to capture content positioned far outside the viewport.
    // Avoid overflow:hidden, display:none, visibility:hidden and opacity:0.
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
            // PNG без потерь: линии и текст не размываются JPEG-сжатием.
            image: { type: 'png' },
            html2canvas: {
                // Целочисленный масштаб в сочетании с border: 1px.
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
        // Может помочь PDF-просмотрщику предложить осмысленное имя
        // при выборе «Сохранить как» из окна просмотра.
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
            // Keep the URL available while the PDF viewer is open.
            window.addEventListener('pagehide', () => URL.revokeObjectURL(url), {
                once: true,
            })
        } else if (fileHandle) {
            // Chrome/Edge: write directly to the file selected with showSaveFilePicker.
            // No temporary PDF tab and no browser download-preview step.
            const writable = await fileHandle.createWritable()
            try {
                await writable.write(pdf.output('blob'))
                await writable.close()
            } catch (error) {
                try {
                    await writable.abort()
                } catch {
                    // Preserve the original write failure.
                }
                throw error
            }
        } else {
            // Fallback for browsers without showSaveFilePicker.
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
                // Allow browsers to finish consuming the download URL.
                setTimeout(() => URL.revokeObjectURL(url), 60_000)
            }
        }
        completed = true
    } catch (error) {
        console.error('Quality passport PDF export failed:', error)
        throw error
    } finally {
        root.unmount()
        container.remove()
        if (!completed && previewWindow && !previewWindow.closed) {
            previewWindow.close()
        }
    }
}
