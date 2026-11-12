// Renders order power-of-attorney templates into named PDF files for export.

import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import html2pdf from 'html2pdf.js'

import PowerOfAttorneyTemplate from '../components/PowerOfAttorneyTemplate'

// Reads an assigned driver's name and ignores empty placeholder values.
export function getAssignedDriverName(order) {
    const value = order?.driver
    const raw = typeof value === 'string' ? value : (value?.full_name ?? value?.name ?? '')
    const name = String(raw ?? '').trim()
    return name && name !== '-' && name !== '—' ? name : ''
}

// Removes unsafe filename characters and limits the name length.
const safeFilenamePart = (value) =>
    String(value)
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 90)

// Builds a PDF filename using the order ID and assigned driver.
export const powerOfAttorneyFilename = (order) => {
    const driver = getAssignedDriverName(order)
    const name = driver ? safeFilenamePart(driver) : 'водитель_не_назначен'
    return `Доверенность_${order.id}_${name}.pdf`
}

// Renders an order's template offscreen and returns its PDF file.
export async function preparePowerOfAttorneyFile(order) {
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '0'
    container.style.top = '0'
    container.style.width = '1px'
    container.style.height = '1px'
    container.style.overflow = 'hidden'
    container.style.background = '#fff'
    container.style.pointerEvents = 'none'
    container.style.zIndex = '-1'

    document.body.appendChild(container)
    const root = createRoot(container)
    try {
        flushSync(
            // Mounts the template synchronously before PDF capture.
            () => root.render(<PowerOfAttorneyTemplate order={order} />),
        )
        if (document.fonts?.ready) await document.fonts.ready
        await new Promise(
            // Allows the rendered template to settle before capture.
            (resolve) => setTimeout(resolve, 300),
        )

        const poaPage = container.querySelector('.poa-page')
        if (!poaPage) throw new Error(`Не найден шаблон доверенности заявки № ${order.id}`)

        const filename = powerOfAttorneyFilename(order)
        const worker = html2pdf()
            .set({
                filename,
                margin: 0,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: 0,
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            })
            .from(poaPage)

        const pdf = await worker.toPdf().get('pdf')
        return { filename, blob: pdf.output('blob') }
    } finally {
        root.unmount()
        container.remove()
    }
}

// Prepares one power-of-attorney PDF for each order in sequence.
export async function preparePowerOfAttorneyFiles(orders) {
    const files = []
    for (const order of orders ?? []) {
        files.push(await preparePowerOfAttorneyFile(order))
    }
    return files
}

// export async function exportPowerOfAttorney(orders) {
//     for (const file of await preparePowerOfAttorneyFiles(orders)) {
//         const url = URL.createObjectURL(file.blob)
//         const link = document.createElement('a')
//         link.href = url
//         link.download = file.filename
//         document.body.appendChild(link)
//         try {
//             link.click()
//         } finally {
//             link.remove()
//             setTimeout(() => URL.revokeObjectURL(url), 60_000)
//         }
//     }
//     return (orders ?? []).length
// }
