import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import html2pdf from 'html2pdf.js'

import PowerOfAttorneyTemplate from '../../components/PowerOfAttorneyTemplate'

export async function exportPowerOfAttorney(orders) {
    for (const order of orders) {
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

        flushSync(() => {
            root.render(<PowerOfAttorneyTemplate order={order} />)
        })

        await new Promise((resolve) => setTimeout(resolve, 300))

        const poaPage = container.querySelector('.poa-page')

        await html2pdf()
            .set({
                filename: `Доверенность_${order.id}_${order.driver ?? 'водитель_не_указан'}.pdf`,
                margin: 0,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: 0,
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                },
            })
            .from(poaPage)
            .save()

        root.unmount()
        document.body.removeChild(container)
    }
}
